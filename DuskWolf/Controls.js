//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.keyboard");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.frameTicker");

dusk.load.provide("dusk.controls");

/** @namespace dusk.controls
 * @name dusk.controls
 * 
 * @description Provides a simple way to describe changeable control schemes and implement game controllers.
 * 
 * How control mapping works is that code registers the name of a "control", and a default key/button, and then either gets an event when the control is pressed, or checks button/key presses against it.
 *	This allows the input mapped to a control to change.
 * 
 * This module supports gamepads, which are automatically detected and set up.
 *	Gamepads consist of buttons, and axes.
 *	Buttons are essentially numbered from 0 to however many buttons there are on the controler, and this is the number used to describe them on controls.
 *
 * Axes, however, are more complicated.
 *	Like buttons, axes are numbered, however they also have an intensity from `0.0` to `1.0`, and so they are represented using strings like `"0+0.5` or `"2-0.2"` wherever a button is expected.
 *	The first example means that for the control to be active, stick 0 must be halfway or more to it's maximum positive (right or down) value.
 * 	The second example means that for the control to be active, stick 2 must be 20% or more to it's maximum negative (up or left) value.
 * 
 * @since 0.0.15-alpha
 */

dusk.controls._mappings = {};

dusk.controls._buttons = [];
dusk.controls._axes = [];

dusk.controls.TYPE_KEY = 0;
dusk.controls.TYPE_BUTTON = 1;
dusk.controls.TYPE_AXIS = 2;

dusk.controls.controlPressed = new dusk.EventDispatcher("dusk.controls.controlPressed");

dusk.controls.buttonPress = new dusk.EventDispatcher("dusk.controls.buttonPressed");
dusk.controls.buttonUp = new dusk.EventDispatcher("dusk.controls.buttonUp");

dusk.controls.addControl = function(name, defaultKey, defaultButton) {
	if(name in dusk.controls._mappings) return;
	dusk.controls._mappings[name] = [defaultKey, defaultButton];
};

dusk.controls.mapKey = function(name, key) {
	dusk.controls._mappings[name][0] = key;
};

dusk.controls.mapButton = function(name, button) {
	dusk.controls._mappings[name][1] = button;
};

dusk.controls.check = function(name, key, button) {
	return dusk.controls.checkKey(key) || dusk.controls.checkButton(button);
};

dusk.controls.checkKey = function(name, key) {
	return dusk.controls._mappings[name][0] == key;
};

dusk.controls.checkButton = function(name, button) {
	if(typeof dusk.controls._mappings[name][1] == "string") {
		var axis = dusk.controls._mappings[name][1].split("+")[0].split("-")[0];
		if(axis == button) {
			if(dusk.controls._mappings[name][1].indexOf("+") !== -1) {
				if(+dusk.controls._mappings[name][1].split("+")[1] < this._axes[axis]) return true;
			}else if(dusk.controls._mappings[name][1].indexOf("-") !== -1) {
				if(-dusk.controls._mappings[name][1].split("-")[1] > this._axes[axis]) return true;
			}
		}
		
		return false;
	}	
	return dusk.controls._mappings[name][1] == button;
};

dusk.controls.controlActive = function(name) {
	return dusk.keyboard.isKeyPressed(dusk.controls._mappings[name][0]) || dusk.controls.isButtonPressed(dusk.controls._mappings[name][1]);
};

dusk.controls._keyPressed = function(e) {
	for(var m in dusk.controls._mappings) {
		if(dusk.controls._mappings[m][0] == e.which) {
			var toFire = {};
			toFire.keyEvent = e;
			toFire.type = dusk.controls.TYPE_KEY;
			toFire.control = m;
			
			dusk.controls.controlPressed.fire(toFire);
		}
	}
};
dusk.keyboard.keyPress.listen(dusk.controls._keyPressed, null);

dusk.controls._buttonPressed = function(e) {
	for(var m in dusk.controls._mappings) {
		if(dusk.controls._mappings[m][1] == e.which) {
			var toFire = {};
			toFire.buttonEvent = e;
			toFire.type = dusk.controls.TYPE_BUTTON;
			toFire.control = m;
			
			dusk.controls.controlPressed.fire(toFire);
		}
	}
};
dusk.controls.buttonPress.listen(dusk.controls._buttonPressed, null);

dusk.controls._frame = function(e) {
	var navigatorGetGamepads = navigator.getGamepads || navigator.webkitGetGamepads || function(){return [null];};
	var gamepad = navigatorGetGamepads.call(navigator)[0];
	if(gamepad) {
		for(var i = 0; i < gamepad.buttons.length-1; i ++) {
			if(!dusk.controls._buttons[i] && gamepad.buttons[i]) {
				dusk.controls.buttonPress.fire({"which":i});
			}else if(dusk.controls._buttons[i] && !gamepad.buttons[i]) {
				dusk.controls.buttonUp.fire({"which":i});
			}
			
			dusk.controls._buttons[i] = gamepad.buttons[i] > 0.2;
		}
		
		for(var i = 0; i < gamepad.axes.length-1; i ++) {
			dusk.controls._axes[i] = gamepad.axes[i];
		}
	}
};
dusk.frameTicker.onFrame.listen(dusk.controls._frame, null);

dusk.controls.isButtonPressed = function(button) {
	if(typeof button == "string") {
		var axis = button.split("+")[0].split("-")[0];
		if(button.indexOf("+") !== -1) {
			if(+button.split("+")[1] < this._axes[axis]) return true;
		}else if(button.indexOf("-") !== -1) {
			if(-button.split("-")[1] > this._axes[axis]) return true;
		}
		
		return false;
	}	
	return this._buttons[button];
};
