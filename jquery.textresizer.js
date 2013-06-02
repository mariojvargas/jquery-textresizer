/*
jQuery Text Resizer Plugin v1.1.0
    
Copyright (c) 2009-2013 Mario J Vargas
See the file MIT-LICENSE.txt for copying permission.
    
Website: http://angstrey.com/
Documentation: http://angstrey.com/index.php/projects/jquery-text-resizer-plugin/
*/
;(function ($) {
    "use strict";

    var TextResizerPlugin, debug;

    debug = function (obj) {
        if (window.console && "function" === (typeof window.console.log)) {
            var key;

            if ("string" === (typeof obj)) {
                console.log("jquery.textresizer => " + obj);
            } else {
                console.log("jquery.textresizer => {");
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        console.log("    " + key + ": " + obj[key]);
                    }
                }
                console.log("}");
            }
        }
    };

    TextResizerPlugin = function ($elements, options) {
        this.$elements = $elements;
        this.settings = options || TextResizerPlugin.defaults;
    };

    TextResizerPlugin.defaults = {
        debugMode: false,                               // Disable debug mode.
        type: "fontSize",                               // Available options: fontSize, css, cssClass.
        target: "body",                                 // The HTML element to which the new font size will be applied.
        selectedIndex: -1,                              // No font size option selected by default.
        suppressClickThrough: true                      // Disables click-through of font size controls.
    };

    TextResizerPlugin.prototype.buildDefaultFontSizes = function (numElms) {
        if (0 === numElms) {
            return;
        }

        var size0 = 8,                // Initial size, measured in pixels
            mySizes = [],
            i,
            value;

        if (this.settings.debugMode) {
            debug("In buildDefaultFontSizes: numElms = " + numElms);
        }

        if (this.settings.debugMode) {
            for (i = 0; i < numElms; i += 1) {
                // Append elements in increments of 2 units
                value = (size0 + (i * 2)) / 10;
                mySizes.push(value + "em");

                debug("In buildDefaultFontSizes: mySizes[" + i + "] = " + mySizes[i]);
            }
        } else {
            for (i = 0; i < numElms; i += 1) {
                // Append elements in increments of 2 units
                value = (size0 + (i * 2)) / 10;
                mySizes.push(value + "em");
            }
        }

        return mySizes;
    };

    TextResizerPlugin.prototype.serializeHash = function (dictionary) {
        // jQuery's param() function does not replace white space correctly
        return $.param(dictionary).replace(/\+/g, "%20");
    };

    TextResizerPlugin.prototype.deserializeHash = function (serializedValue) {
        var i,
            valueCount,
            keyValuePair,
            dictionary = {},
            separatorPattern = /\&|\|/g,
            dictValues = serializedValue.split(separatorPattern);

        for (i = 0, valueCount = dictValues.length; i < valueCount; i += 1) {
            // Separate key/value pair and assign to dictionary
            keyValuePair = dictValues[i].split("=");
            dictionary[keyValuePair[0]] = window.decodeURIComponent(keyValuePair[1]);
        }

        // Now that the object is finished, return it
        return dictionary;
    };

    TextResizerPlugin.prototype.buildCookieID = function (selector, target, prop) {
        return "JQUERY.TEXTRESIZER[" + selector + "," + target + "]." + prop;
    };

    TextResizerPlugin.prototype.getCookie = function (selector, target, prop) {
        var id = this.buildCookieID(selector, target, prop),
            cookieValue = $.cookie(id);

        if ($.cookie(id + ".valueType") === "dict" && cookieValue) {
            return this.deserializeHash(cookieValue);
        }

        return cookieValue;
    };

    TextResizerPlugin.prototype.setCookie = function (selector, target, prop, value) {
        var id = this.buildCookieID(selector, target, prop),
            // Cookie expires in 1 year (365 days/year)
            cookieOpts = { expires: 365, path: "/" },
            serializedVals;

        // Serialize value if it's an object
        if ("object" === (typeof value)) {
            // Store type of value so we can convert it back 
            // to a dictionary object
            $.cookie(id + ".valueType", "dict", cookieOpts);

            serializedVals = this.serializeHash(value);

            $.cookie(id, serializedVals, cookieOpts);

            if (this.settings.debugMode) {
                debug("In setCookie: Cookie: " + id + ": " + serializedVals);
            }
        } else {
            $.cookie(id, value, cookieOpts);

            if (this.settings.debugMode) {
                debug("In setCookie: Cookie (not hash): " + id + ": " + value);
            }
        }
    };

    TextResizerPlugin.prototype.applyInlineCssProperties = function ($targetElement, cssStyles) {
        $targetElement.css(cssStyles);
    };

    TextResizerPlugin.prototype.applyCssClass = function ($targetElement, newSize, cssClasses) {
        // Remove previously assigned CSS class from
        // target element. Iterating through matched
        // elements ensures the class is removed
        $.each(cssClasses, function () {
            var className = this.toString();
            $targetElement.each(function () {
                var $currentElement = $(this);
                if ($currentElement.hasClass(className)) {
                    $currentElement.removeClass(className);
                }
            });
        });

        // Now apply the new CSS class
        $targetElement.addClass(newSize);
    };

    TextResizerPlugin.prototype.applySpecificFontSize = function ($targetElement, newSize) {
        $targetElement.css("font-size", newSize);
    };

    TextResizerPlugin.prototype.applyFontSize = function (newSize, settings) {
        if (this.settings.debugMode) {
            debug(["target: " + settings.target, "newSize: " + newSize, "type: " + settings.type].join(", "));
        }

        var targetElm = $(settings.target);
        switch (settings.type) {
            case "css":
                this.applyInlineCssProperties(targetElm, newSize);
                break;

            case "cssClass":
                this.applyCssClass(targetElm, newSize, settings.sizes);
                break;

            default:
                this.applySpecificFontSize(targetElm, newSize);
                break;
        }
    };

    TextResizerPlugin.prototype.loadPreviousState = function (settings) {
        // Determine if jquery.cookie is installed
        if ($.cookie) {
            if (this.settings.debugMode) {
                debug("In loadPreviousState(): jquery.cookie: INSTALLED");
            }

            var rawSelectedIndex = this.getCookie(settings.selector, settings.target, "selectedIndex"),
                selectedIndex = parseInt(rawSelectedIndex, 10),
                prevSize = this.getCookie(settings.selector, settings.target, "size");

            if (!isNaN(selectedIndex)) {
                settings.selectedIndex = selectedIndex;
            }

            if (this.settings.debugMode) {
                debug("In loadPreviousState: selectedIndex: " + selectedIndex + "; type: " + (typeof selectedIndex));

                debug("In loadPreviousState: prevSize: " + prevSize + "; type: " + (typeof prevSize));
            }

            if (prevSize) {
                this.applyFontSize(prevSize, settings);
            }
        } else {
            if (this.settings.debugMode) {
                debug("In loadPreviousState(): jquery.cookie: NOT INSTALLED");
            }
        }
    };

    TextResizerPlugin.prototype.markActive = function (sizeButton, settings) {
        // Deactivate previous button
        $(settings.selector).removeClass("textresizer-active");

        // Mark this button as active
        $(sizeButton).addClass("textresizer-active");
    };

    TextResizerPlugin.prototype.saveState = function (newSize, settings) {
        // Determine if jquery.cookie is installed
        if ($.cookie) {
            if (this.settings.debugMode) {
                debug("In saveState(): jquery.cookie: INSTALLED");
            }

            this.setCookie(settings.selector, settings.target, "size", newSize);
            this.setCookie(settings.selector, settings.target, "selectedIndex", settings.selectedIndex);
        } else {
            if (this.settings.debugMode) {
                debug("In saveState(): jquery.cookie: NOT INSTALLED");
            }
        }
    };

    TextResizerPlugin.prototype.attachResizerToElement = function (element, index, settings) {
        var thisPlugin = this,
            $resizeButton = $(element),                // Current resize button
            currSizeValue = settings.sizes[index];      // Size corresponding to this resize button

        // Mark this button as active if necessary
        if (index === settings.selectedIndex) {
            $resizeButton.addClass("textresizer-active");
        }

        // Apply the font size to target element when its 
        // corresponding resize button is clicked
        $resizeButton.on("click", { index: index }, function (e) {
            if (settings.suppressClickThrough) {
                e.preventDefault();
            }

            settings.selectedIndex = e.data.index;

            thisPlugin.applyFontSize(currSizeValue, settings);
            thisPlugin.saveState(currSizeValue, settings);

            thisPlugin.markActive(this, settings);
        });
    };

    TextResizerPlugin.prototype.init = function () {
        var thisPlugin = this,
            numberOfElements = thisPlugin.$elements.size(),
            settings,
            debugMode = TextResizerPlugin.defaults.debugMode;

        if (debugMode) {
            debug("jquery.textresizer => selection count: " + numberOfElements);
        }

        // Stop plugin execution if no matched elements
        if (0 === numberOfElements) {
            return;
        }

        // Set up main options before element iteration
        thisPlugin.settings = $.extend({
            selector: thisPlugin.$elements.selector,
            sizes: this.buildDefaultFontSizes(numberOfElements)     // Default font sizes based on number of resize buttons.
        },
            $.fn.textresizer.defaults,
            thisPlugin.settings
        );
        settings = thisPlugin.settings;

        debugMode = settings.debugMode;

        if (debugMode) {
            debug(settings);
        }

        // Ensure that the number of defined sizes is suitable
        // for number of resize buttons.
        if (numberOfElements > settings.sizes.length) {
            if (debugMode) {
                debug("ERROR: Number of defined sizes incompatible with number of buttons => elements: " + numberOfElements
                    + "; defined sizes: " + settings.sizes.length
                    + "; target: " + settings.target);
            }

            return;    // Stop execution of the plugin
        }

        thisPlugin.loadPreviousState(settings);

        return thisPlugin;
    };

    $.fn.textresizer = function (options) {
        var plugin = new TextResizerPlugin(this, options).init();

        // Iterate and bind click event function to each element
        return this.each(function (i) {
            plugin.attachResizerToElement(this, i, plugin.settings);
        });
    };

    $.fn.textresizer.defaults = TextResizerPlugin.defaults;
})(window.jQuery);