//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.input.mouse", (function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var Pool = load.require("dusk.utils.Pool");
	var dusk = load.require("dusk");
	var frameTicker = load.require("dusk.utils.frameTicker");
	
	var mouse = {};
	
	var _lastElement = null;
	
	mouse.onClick = new EventDispatcher("dusk.input.mouse.onClick");
	mouse.onMove = new EventDispatcher("dusk.input.mouse.onMove");
	
	mouse.cursor = "initial";
	
	mouse.BUTTON_LEFT = 0;
	mouse.BUTTON_MIDDLE = 1;
	mouse.BUTTON_RIGHT = 2;
	
	frameTicker.onFrame.listen(function() {
		if(_lastElement && _lastElement.style.cursor != mouse.cursor) {
			_lastElement.style.cursor = mouse.cursor;
		}
	});
	
	/** Sets an element so that it will get events.
	 * @param {HTMLElement} element The HTML element to handle.
	 * @param {string} rootName The name of the root. This will be set to the "root" property of the event.
	 * @since 0.0.21-alpha
	 */
	mouse.trapElement = function(element, rootName) {
		element.addEventListener("click", function(e) {
			e.preventDefault();
			e.root = rootName;
			
			mouse.onClick.fire(e);
		});
		
		element.addEventListener("mousemove", function(e){
			var x = e.clientX - element.getBoundingClientRect().left;
			var y = e.clientY - element.getBoundingClientRect().top;
			
			_lastElement = element;
			
			mouse.onMove.fire({"x":x, "y":y, "root":rootName});
		});
		
		element.addEventListener("contextmenu", function(e){
			e.preventDefault();
			e.root = rootName;
			
			mouse.onClick.fire(e);
		});
	}
	
	return mouse;
})());
