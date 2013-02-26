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
 *	Buttons are essentially numbered from 0 to however many buttons there are on the controller, and this is the number used to describe them on controls.
 *
 * Axes, however, are more complicated.
 *	Like buttons, axes are numbered, however they also have an intensity from `0.0` to `1.0`, and so they are represented using strings like `"0+0.5` or `"2-0.2"` wherever a button is expected.
 *	The first example means that for the control to be active, stick 0 must be halfway or more to it's maximum positive (right or down) value.
 * 	The second example means that for the control to be active, stick 2 must be 20% or more to it's maximum negative (up or left) value.
 * 
 * @since 0.0.15-alpha
 */

/** The mappings of controls to their respective key or button.
 * 
 * The key of this object is the name of the control, and the value is a two element array. The first element is the keycode of the key, and the second a button representation.
 * @type object
 * @private
 */
dusk.controls._mappings = {};

/** The currently pressed buttons.
 * 
 * The index is the ID of the button, and the value is a boolean describing whether the button is pressed or not.
 * @type array
 * @private
 */
dusk.controls._buttons = [];
/** The current state of all the axises.
 * 
 * The index is the axis ID, and the value is a number from -1.0 to 1.0 indicating the intensity of the stick.
 * @type array
 * @private
 */
dusk.controls._axes = [];

/** A constant used when firing the `{@link dusk.controls.controlPressed}` event, indicating that a key was pressed.
 * @type integer
 * @constant
 * @value 0
 */
dusk.controls.TYPE_KEY = 0;
/** A constant used when firing the `{@link dusk.controls.controlPressed}` event, indicating that a controller button was pressed.
 * @type integer
 * @constant
 * @value 1
 */
dusk.controls.TYPE_BUTTON = 1;
/** A constant used when firing the `{@link dusk.controls.controlPressed}` event, indicating that an axis was triggered.
 * @type integer
 * @constant
 * @value 2
 */
dusk.controls.TYPE_AXIS = 2;

/** Fired when a key or button control has been activated, axes are not supported.
 * 
 * The event object contains three properties. `type`; one of the `TYPE_*` constants indicating what was pressed; `control`, a string with the name of the control.
 * 	The third property is either `buttonEvent` or `keyEvent` depending on what was pressed. This is either a keyPress or buttonPress event.
 * @type dusk.EventDispatcher
 */
dusk.controls.controlPressed = new dusk.EventDispatcher("dusk.controls.controlPressed");

/** Fired when a button on the gamepad is pressed.
 * 
 * The event object is a `buttonPress` event, which has only one property `which`; the ID of the button.
 * @type dusk.EventDispatcher
 */
dusk.controls.buttonPress = new dusk.EventDispatcher("dusk.controls.buttonPressed");
/** Fired when a button on the gamepad is released.
 * 
 * The event object is a `buttonPress` event, which has only one property `which`; the ID of the button.
 * @type dusk.EventDispatcher
 */
dusk.controls.buttonUp = new dusk.EventDispatcher("dusk.controls.buttonUp");



/** Adds a new control, with the specified default key/button presses.
 * 
 * If the control is already registered, this does nothing.
 * @param {string} name The name of the controll to add.
 * @param {integer} defaultKey The default key to fire this control on, as a keycode.
 * @param {integer|string} defaultButton The default button to fire this control on, either a button ID, or a axis description.
 */
dusk.controls.addControl = function(name, defaultKey, defaultButton) {
	if(name in dusk.controls._mappings) return;
	dusk.controls._mappings[name] = [defaultKey===undefined?null:defaultKey, defaultButton===undefined?null:defaultButton];
};

/** Returns the buttons control mappings assigned to that control.
 * 
 * Returns an array of the form `[key, button]`.
 * @param {string} name The control to look up.
 * @return {?array} The bindings to that control, or null if it is not set.
 * @since 0.0.17-alpha
 */
dusk.controls.lookupControl = function(name) {
	if(!(name in dusk.controls._mappings)) return null;
	return dusk.controls._mappings[name];
};

/** Registers a key to a control; when that key is pressed, the control will fire.
 * @param {string} name The name of the control to add the key to.
 * @param {integer} key The key to set the control to, as a keycode.
 */
dusk.controls.mapKey = function(name, key) {
	dusk.controls._mappings[name][0] = key;
};

/** Registers a button or axis to a control; when that button is pressed, or the axis is greater than the threshold, the control will fire.
 * @param {string} name The name of the control to add the button/axis to.
 * @param {integer|string} button The button ID, or the axis description to register to the control.
 */
dusk.controls.mapButton = function(name, button) {
	dusk.controls._mappings[name][1] = button;
};

/** Checks if a button or a key matches the specified control.
 * 
 * If either of the specified values match the control, then this will be true.
 * @param {string} name The name of the control to check.
 * @param {integer} key The keycode of the key to check.
 * @param {integer|string} button The button ID or an axis description to check.
 * @return {boolean} Whether either the button or the key match the specified control.
 */
dusk.controls.check = function(name, key, button) {
	return dusk.controls.checkKey(key) || dusk.controls.checkButton(button);
};

/** Checks if a key matches the specified control.
 * @param {string} name The control to check.
 * @param {integer} key The keycode to check.
 * @return {boolean} Whether the specified key is the same key used to trigger the control.
 */
dusk.controls.checkKey = function(name, key) {
	return dusk.controls._mappings[name][0] == key;
};

/** Checks if a button or axis description matches the specified control.
 * @param {string} name The control to check.
 * @param {integer|string} button The axis or button to check.
 * @return {boolean} Whether the specified button or axis matches the control.
 */
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

/** Given the name of a control, returns whether the control is currently active.
 * @param {string} name The name of the control to check.
 * @return {boolean} Whether the control is active.
 */
dusk.controls.controlActive = function(name) {
	return dusk.keyboard.isKeyPressed(dusk.controls._mappings[name][0]) || dusk.controls.isButtonPressed(dusk.controls._mappings[name][1]);
};

/** Checks if a button is pressed, or an axis is tilted.
 * @param {integer|string} button The button/axis to check, as a button ID or an axis description.
 * @return {boolean} Whether said button/axis is pressed/tilted.
 */
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

/** Used internally to handle the `{@link dusk.keyboard.keyPress}` event.
 *	This will check to see if a control is fired from the keypress.
 * @param {object} e The keyPress event object.
 * @private
 */
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

/** Used internally to handle the `{@link dusk.controls.buttonPress}` event.
 * 	This will check to see if a button, and only a button, control is fired.
 * @param {object} e The buttonPress event object.
 * @private
 */
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

/** Registered on `{@link dusk.frameTicker.onFrame}`.
 * 	This checks to see if gamepad buttons or pressed, or if axises are tilted, and fires the relative events, and updates the relative variables.
 * @param {object} e The event object.
 * @private
 */
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
dusk.frameTicker.onFrame.listen(dusk.controls._frame, dusk.controls);

Object.seal(dusk.controls);
