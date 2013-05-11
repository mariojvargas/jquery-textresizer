/*
	jQuery Text Resizer plugin.
	
	Author: Mario J Vargas (angstrey at hotmail dot com)
	Website: http://angstrey.com/
	Documentation: http://angstrey.com/index.php/projects/jquery-text-resizer-plugin/
	
	Version: 1.0
	Revision History:
		* 2009-09-03: Version 1.0. Initial Release
*/
(function($) {
	var DEBUG_MODE = false;
	
	$.fn.textresizer = function( options ) 
	{
	    if( DEBUG_MODE )
		    debug( this );
		
		// Stop plugin execution if no matched elements
		if( this.size() == 0 )
			return;

		// Default font sizes based on number of resize buttons.
		// "this" refers to current jQuery object
		var defaultSizes = buildDefaultFontSizes( this.size() );
	
		// Set up main options before element iteration
		var settings = $.extend( { selector: $(this).selector, sizes: defaultSizes, selectedIndex: -1 }, $.fn.textresizer.defaults, options );

		// Ensure that the number of defined sizes is suitable
		// for number of resize buttons.
		if( this.size() > settings.sizes.length )
		{
		    if( DEBUG_MODE )
		    {
			    debug( 
				    "ERROR: Number of defined sizes incompatible with number of buttons => elements: " + this.size() 
				    + "; defined sizes: " + settings.sizes.length
				    + "; target: " + settings.target );
            }
               			
			return;	// Stop execution of the plugin
		}

		loadPreviousState( settings );
	
		// Iterate and bind click event function to each element
		return this.each( function( i ) {
			var $this = $(this);	// Current resize button
		
			var currSizeValue = settings.sizes[ i ];	// Size corresponding to this resize button
			
			// Mark this button as active if necessary
			if( settings.selectedIndex == i )
				$(this).addClass( "textresizer-active" );
			
			// Apply the font size to target element when its 
			// corresponding resize button is clicked
			$this.bind( "click", { index: i }, function( e ) {		
				settings.selectedIndex = e.data.index;
				
				applyFontSize( currSizeValue, settings );
				saveState( currSizeValue, settings );

				markActive( this, settings );
			});
		});
	}
	
	// Default options of textresizer plugin
	$.fn.textresizer.defaults = {
		type  : "fontSize",	/* Available options: fontSize, css, cssClass */
		target: "body"		/* The HTML element to which the new font size will be applied */
	};

	function applyFontSize( newSize, settings )
	{
	    if( DEBUG_MODE )
		    debug( [ "target: " + settings.target, "newSize: " + newSize, "type: " + settings.type ].join( ", " ) );

		var targetElm = $( settings.target );
		switch( settings.type )
		{
			case "css":
				// Apply new inline CSS properties
				targetElm.css( newSize );
				break;

			case "cssClass":
				// Remove previously assigned CSS class from
				// target element. Iterating through matched
				// elements ensures the class is removed
				var cssClasses = settings.sizes;
				$.each( cssClasses, function( i, value ) {
					targetElm.each( function() {
						if( $(this).hasClass( value ) )
							$(this).removeClass( value );
					});
				});
				
				// Now apply the new CSS class
				targetElm.addClass( newSize );
				break;

			default:
				// Apply new font size
				targetElm.css( "font-size", newSize );
				break;
		}		
	}
	
	function markActive( sizeButton, settings )
	{
		// Deactivate previous button
		$(settings.selector).removeClass( "textresizer-active" );
		
		// Mark this button as active
		$(sizeButton).addClass( "textresizer-active" );
	}
	
	function buildCookieID( selector, target, prop )
	{
	    return "JQUERY.TEXTRESIZER[" + selector + "," + target + "]." + prop;
	}
	
	function getCookie( selector, target, prop )
	{
		var id = buildCookieID( selector, target, prop );
		
		var cookieValue = $.cookie( id );
		
		if( $.cookie( id + ".valueType" ) == "dict" && cookieValue )
		{
			var dict = {};
			var dictValues = cookieValue.split( "|" );
			
			for( var i = 0; i < dictValues.length; i++ )
			{
				// Separate key/value pair and assign to dictionary
				var keyValuePair = dictValues[ i ].split( "=" );
				dict[ keyValuePair[ 0 ] ] = unescape( keyValuePair[ 1 ] );
			}
			
			// Now that the object is finished, return it
			return dict;
		}
		
		return cookieValue;
    }
    
    function setCookie( selector, target, prop, value )
    {
		var id = buildCookieID( selector, target, prop );

		// Cookie expires in 1 year (365 days/year)
		var cookieOpts = { expires: 365, path: "/" };
		
		// Serialize value if it's an object
		if( typeof( value ) == "object" )
		{
		    // TODO: I think I wrote a JavaScript dictionary object serializer somewhere... Have to find it...
		    
			// Store type of value so we can convert it back 
			// to a dictionary object
			$.cookie( id + ".valueType", "dict", cookieOpts );

			var dict = value;	// (Assigning reference to variable dict for readability)
			var dictValues = new Array();
			for( var key in dict )
			{
				dictValues.push( key + "=" + escape( dict[ key ] ) );
			}

			var serializedVals = dictValues.join( "|" );
			$.cookie( id, serializedVals, cookieOpts );
			
			if( DEBUG_MODE )
			    debug( "In setCookie: Cookie: " + id + ": " + serializedVals );
		}
		else
		{
			$.cookie( id, value, cookieOpts );

            if( DEBUG_MODE )
			    debug( "In setCookie: Cookie: " + id + ": " + value );
		}
	}
	
	function loadPreviousState( settings )
	{
		// Determine if jquery.cookie is installed
		if( $.cookie )
		{
		    if( DEBUG_MODE )
			    debug( "In loadPreviousState(): jquery.cookie: INSTALLED" );

			var selectedIndex = getCookie( settings.selector, settings.target, "selectedIndex" );
			if( DEBUG_MODE )
			    debug( "In loadPreviousState: selectedIndex: " + selectedIndex + "; type: " + typeof(selectedIndex) );
			if( selectedIndex )
				settings.selectedIndex = selectedIndex;

			var prevSize = getCookie( settings.selector, settings.target, "size" );
			if( DEBUG_MODE )
			    debug( "In loadPreviousState: prevSize: " + prevSize + "; type: " + typeof(prevSize) );
			if( prevSize )
				applyFontSize( prevSize, settings );
		}
		else
		{
		    if( DEBUG_MODE )
			    debug( "In loadPreviousState(): jquery.cookie: NOT INSTALLED" );
		}
	}
	
	function saveState( newSize, settings )
	{
		// Determine if jquery.cookie is installed
		if( $.cookie )
		{
			if( DEBUG_MODE )
			    debug( "In saveState(): jquery.cookie: INSTALLED" );
			
			setCookie( settings.selector, settings.target, "size", newSize );
			setCookie( settings.selector, settings.target, "selectedIndex", settings.selectedIndex );
		}
		else
		{
			if( DEBUG_MODE )
			    debug( "In saveState(): jquery.cookie: NOT INSTALLED" );
		}
	}
	
	function debug( $obj )
	{
		if( window.console && window.console.log )
		{
			if( typeof( $obj ) == "string" )
				window.console.log( "jquery.textresizer => " + $obj );
			else	// Assumes $obj is jQuery object
				window.console.log( "jquery.textresizer => selection count: " + $obj.size() );
		}
	}
	
	function buildDefaultFontSizes( numElms )
	{
		var size0 = 8;				/* Initial size, measured in pixels */
		
		var mySizes = new Array();
		
		if( DEBUG_MODE )
		    debug( "In buildDefaultFontSizes: numElms = " + numElms );
		
		if( DEBUG_MODE )
		{
		    for( var i = 0; i < numElms; i++ )
		    {
			    // Append elements in increments of 2 units
			    var value = (size0 + (i * 2)) / 10;
			    mySizes.push( value + "em" );	
    			
			    if( DEBUG_MODE )
			        debug( "In buildDefaultFontSizes: mySizes[" + i + "] = " + mySizes[ i ] );
		    }
		}
		else
		{
		    for( var i = 0; i < numElms; i++ )
		    {
			    // Append elements in increments of 2 units
			    var value = (size0 + (i * 2)) / 10;
			    mySizes.push( value + "em" );	
		    }
		}
		
		return mySizes;
	}
})(jQuery);