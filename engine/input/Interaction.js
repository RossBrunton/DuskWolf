//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.input.interaction", (function() {
	var EventDispatcher = load.require("dusk.EventDispatcher");
	var keyboard = load.require("dusk.input.keyboard");
	var gamepad = load.require("dusk.input.gamepad");
	var mouse = load.require("dusk.input.mouse");
	var Pool = load.require("dusk.Pool");
	
	var interaction = {};
	
	interaction.on = new EventDispatcher(
		"dusk.input.interaction.on", EventDispatcher.MODE_AND, EventDispatcher.FILTER_MULTI
	);
	
	interaction.KEY_DOWN = 1;
	interaction.KEY_UP = 2
	interaction.BUTTON_DOWN = 4;
	interaction.BUTTON_UP = 8;
	interaction.MOUSE_CLICK = 16;
	interaction.MOUSE_MOVE = 32;
	
	keyboard.keyPress.listen(function(e) {
		var obj = _interactions.alloc();
		
		obj.which = e.keyCode;
		obj.shift = e.shiftKey;
		obj.ctrl = e.ctrlKey;
		obj.alt = e.altKey;
		obj.meta = e.metaKey;
		obj.type = interaction.KEY_DOWN;
		obj.filter = (obj.which << 16) | obj.type;
		
		var toRet = interaction.on.fire(obj, obj.filter);
		_interactions.free(obj);
		return toRet;
	});
	
	keyboard.keyUp.listen(function(e) {
		var obj = _interactions.alloc();
		
		obj.which = e.keyCode;
		obj.shift = e.shiftKey;
		obj.ctrl = e.ctrlKey;
		obj.alt = e.altKey;
		obj.meta = e.metaKey;
		obj.type = interaction.KEY_UP;
		obj.filter = (obj.which << 16) | obj.type;
		
		var toRet = interaction.on.fire(obj, obj.filter);
		_interactions.free(obj);
		return toRet;
	});
	
	gamepad.buttonPress.listen(function(e) {
		var obj = _interactions.alloc();
		
		obj.which = e.which;
		obj.axis = e.axis;
		obj.type = interaction.BUTTON_DOWN;
		
		if(e.axis) {
			obj.filter = obj.type;
		}else{
			obj.filter = (obj.which << 16) | obj.type;
		}
		
		var toRet = interaction.on.fire(obj, obj.filter);
		_interactions.free(obj);
		return toRet;
	});
	
	gamepad.buttonUp.listen(function(e) {
		var obj = _interactions.alloc();
		
		obj.which = e.which;
		obj.axis = e.axis;
		obj.type = interaction.BUTTON_UP;
		
		if(e.axis) {
			obj.filter = obj.type;
		}else{
			obj.filter = (obj.which << 16) | obj.type;
		}
		
		var toRet = interaction.on.fire(obj, obj.filter);
		_interactions.free(obj);
		return toRet;
	});
	
	mouse.onClick.listen(function(e) {
		var obj = _interactions.alloc();
		
		obj.which = e.button;
		obj.shift = e.shiftKey;
		obj.ctrl = e.ctrlKey;
		obj.alt = e.altKey;
		obj.meta = e.metaKey;
		obj.type = interaction.MOUSE_CLICK;
		obj.filter = (obj.which << 16) | obj.type
		
		var toRet = interaction.on.fire(obj, obj.filter);
		_interactions.free(obj);
		return toRet;
	});
	
	mouse.onMove.listen(function(e) {
		var obj = _interactions.alloc();
		
		obj.x = e.x;
		obj.y = e.y;
		obj.type = interaction.MOUSE_MOVE;
		obj.filter = obj.type;
		
		var toRet = interaction.on.fire(obj, obj.filter);
		_interactions.free(obj);
		return toRet;
	});
	
	var _interactions = new Pool(Object);
	
	Object.seal(interaction);
	
	return interaction;
})());
