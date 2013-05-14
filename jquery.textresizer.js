/*
	jQuery Text Resizer Plugin v1.1.0-alpha
	
	Copyright (c) 2009, 2013 Mario J Vargas
	See the file MIT-LICENSE.txt for copying permission.
	
	Website: http://angstrey.com/
	Documentation: http://angstrey.com/index.php/projects/jquery-text-resizer-plugin/
*/
(function ($) {
    "use strict";

    var DEBUG_MODE = true;

    function debug(obj) {
        if (window.console && "function" === (typeof window.console.log)) {
            var writeToLog = window.console.log,
                key;

            if ("string" === (typeof obj)) {
                writeToLog("jquery.textresizer => " + obj);
            } else {
                writeToLog("jquery.textresizer => {");
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        writeToLog("    " + key + ": " + obj[key]);
                    }
                }
                writeToLog("}");
            }
        }
    }

    function buildDefaultFontSizes(numElms) {
        var size0 = 8,				// Initial size, measured in pixels
            mySizes = [],
            i,
            value;

        if (DEBUG_MODE) {
            debug("In buildDefaultFontSizes: numElms = " + numElms);
        }

        if (DEBUG_MODE) {
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
    }

    function buildCookieID(selector, target, prop) {
        return "JQUERY.TEXTRESIZER[" + selector + "," + target + "]." + prop;
    }

    function getCookie(selector, target, prop) {
        var id = buildCookieID(selector, target, prop),
            cookieValue = $.cookie(id),
            dict = {},
            dictValues,
            i,
            keyValuePair,
            valueCount;

        if ($.cookie(id + ".valueType") === "dict" && cookieValue) {
            dictValues = cookieValue.split("|");

            for (i = 0, valueCount = dictValues.length; i < valueCount; i += 1) {
                // Separate key/value pair and assign to dictionary
                keyValuePair = dictValues[i].split("=");
                dict[keyValuePair[0]] = window.unescape(keyValuePair[1]);
            }

            // Now that the object is finished, return it
            return dict;
        }

        return cookieValue;
    }

    function setCookie(selector, target, prop, value) {
        var id = buildCookieID(selector, target, prop),
            // Cookie expires in 1 year (365 days/year)
            cookieOpts = { expires: 365, path: "/" },
            dict,
            dictValues = [],
            key,
            serializedVals;

        // Serialize value if it's an object
        if ("object" === (typeof value)) {
            // TODO: I think I wrote a JavaScript dictionary object serializer somewhere... Have to find it...

            // Store type of value so we can convert it back 
            // to a dictionary object
            $.cookie(id + ".valueType", "dict", cookieOpts);

            // (Assigning reference to variable dict for readability)
            dict = value;

            for (key in dict) {
                if (dict.hasOwnProperty(key)) {
                    dictValues.push(key + "=" + window.escape(dict[key]));
                }
            }

            serializedVals = dictValues.join("|");
            $.cookie(id, serializedVals, cookieOpts);

            if (DEBUG_MODE) {
                debug("In setCookie: Cookie: " + id + ": " + serializedVals);
            }
        } else {
            $.cookie(id, value, cookieOpts);

            if (DEBUG_MODE) {
                debug("In setCookie: Cookie: " + id + ": " + value);
            }
        }
    }

    function applyInlineCssProperties(targetElement, cssStyles) {
        targetElement.css(cssStyles);
    }

    function applyCssClass($targetElement, newSize, cssClasses) {
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
    }

    function applySpecificFontSize(targetElement, newSize) {
        targetElement.css("font-size", newSize);
    }

    function applyFontSize(newSize, settings) {
        if (DEBUG_MODE) {
            debug(["target: " + settings.target, "newSize: " + newSize, "type: " + settings.type].join(", "));
        }

        var targetElm = $(settings.target);
        switch (settings.type) {
            case "css":
                applyInlineCssProperties(targetElm, newSize);
                break;

            case "cssClass":
                applyCssClass(targetElm, newSize, settings.sizes);
                break;

            default:
                applySpecificFontSize(targetElm, newSize);
                break;
        }
    }

    function loadPreviousState(settings) {
        // Determine if jquery.cookie is installed
        if ($.cookie) {
            if (DEBUG_MODE) {
                debug("In loadPreviousState(): jquery.cookie: INSTALLED");
            }

            var rawSelectedIndex = getCookie(settings.selector, settings.target, "selectedIndex"),
                selectedIndex = parseInt(rawSelectedIndex, 10),
                prevSize = getCookie(settings.selector, settings.target, "size");

            if (!isNaN(selectedIndex)) {
                settings.selectedIndex = selectedIndex;
            }

            if (DEBUG_MODE) {
                debug("In loadPreviousState: selectedIndex: " + selectedIndex + "; type: " + (typeof selectedIndex));

                debug("In loadPreviousState: prevSize: " + prevSize + "; type: " + (typeof prevSize));
            }

            if (prevSize) {
                applyFontSize(prevSize, settings);
            }
        } else {
            if (DEBUG_MODE) {
                debug("In loadPreviousState(): jquery.cookie: NOT INSTALLED");
            }
        }
    }

    function markActive(sizeButton, settings) {
        // Deactivate previous button
        $(settings.selector).removeClass("textresizer-active");

        // Mark this button as active
        $(sizeButton).addClass("textresizer-active");
    }

    function saveState(newSize, settings) {
        // Determine if jquery.cookie is installed
        if ($.cookie) {
            if (DEBUG_MODE) {
                debug("In saveState(): jquery.cookie: INSTALLED");
            }

            setCookie(settings.selector, settings.target, "size", newSize);
            setCookie(settings.selector, settings.target, "selectedIndex", settings.selectedIndex);
        } else {
            if (DEBUG_MODE) {
                debug("In saveState(): jquery.cookie: NOT INSTALLED");
            }
        }
    }

    $.fn.textresizer = function (options) {
        var numberOfElements = this.size(),
            defaultSizes,
            baseSettings,
            settings;

        if (DEBUG_MODE) {
            debug("jquery.textresizer => selection count: " + numberOfElements);
        }

        // Stop plugin execution if no matched elements
        if (0 === numberOfElements) {
            return;
        }

        // Default font sizes based on number of resize buttons.
        // "this" refers to current jQuery object
        defaultSizes = buildDefaultFontSizes(numberOfElements);
        baseSettings = {
            selector: this.selector,
            sizes: defaultSizes,
            selectedIndex: -1
        };

        // Set up main options before element iteration
        settings = $.extend(baseSettings, $.fn.textresizer.defaults, options);

        if (DEBUG_MODE) {
            debug(settings);
        }

        // Ensure that the number of defined sizes is suitable
        // for number of resize buttons.
        if (this.size() > settings.sizes.length) {
            if (DEBUG_MODE) {
                debug("ERROR: Number of defined sizes incompatible with number of buttons => elements: " + this.size()
				    + "; defined sizes: " + settings.sizes.length
				    + "; target: " + settings.target);
            }

            return;	// Stop execution of the plugin
        }

        loadPreviousState(settings);

        // Iterate and bind click event function to each element
        return this.each(function (i) {
            var $this = $(this),	// Current resize button

                currSizeValue = settings.sizes[i];	// Size corresponding to this resize button

            // Mark this button as active if necessary
            if (i === settings.selectedIndex) {
                $this.addClass("textresizer-active");
            }

            // Apply the font size to target element when its 
            // corresponding resize button is clicked
            $this.bind("click", { index: i }, function (e) {
                if (settings.suppressClickThrough) {
                    e.preventDefault();
                }

                settings.selectedIndex = e.data.index;

                applyFontSize(currSizeValue, settings);
                saveState(currSizeValue, settings);

                markActive(this, settings);
            });
        });
    };

    // Default options of textresizer plugin
    $.fn.textresizer.defaults = {
        type: "fontSize",	         // Available options: fontSize, css, cssClass
        target: "body",		         // The HTML element to which the new font size will be applied
        suppressClickThrough: false  // Disables click-through of font size controls
    };
})(window.jQuery);