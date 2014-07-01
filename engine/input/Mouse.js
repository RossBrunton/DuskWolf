//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.input.mouse", (function() {
	var EventDispatcher = load.require("dusk.EventDispatcher");
	var dusk = load.require("dusk");
	
	var mouse = {};
	
	mouse.onClick = new EventDispatcher("dusk.input.mouse.onClick");
	
	mouse.onMove = new EventDispatcher("dusk.input.mouse.onMove");
	
	mouse.x = 0;
	mouse.y = 0;
	
	mouse.BUTTON_LEFT = 0;
	mouse.BUTTON_MIDDLE = 1;
	mouse.BUTTON_RIGHT = 2;
	
	// Listen for mouseclicks
	dusk.getElementCanvas().addEventListener("click", function(e) {
		e.preventDefault();
		
		mouse.onClick.fire(e);
	});
	
	// And mouse move
	dusk.getElementCanvas().addEventListener("mousemove", function(e){
		mouse.x = e.clientX - dusk.getElementCanvas().getBoundingClientRect().left;
		mouse.y = e.clientY - dusk.getElementCanvas().getBoundingClientRect().top;
		
		mouse.onMove.fire({"x":mouse.x, "y":mouse.y});
	});
	
	// Disable context menu
	dusk.getElement().addEventListener("contextmenu", function(e){
		e.preventDefault();
		mouse.onClick.fire(e);
	});
	
	Object.seal(mouse);
	
	return mouse;
})());
