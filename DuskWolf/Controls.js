//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.controls", (function() {
	var keyboard = load.require("dusk.keyboard");
	var gamepad = load.require("dusk.gamepad");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	var frameTicker = load.require("dusk.frameTicker");
	var options = load.require("dusk.options");
	
	/** @namespace dusk.controls
	 * @name dusk.controls
	 * 
	 * @description Provides a simple way to describe changeable control schemes.
	 * 
	 * How control mapping works is that code registers the name of a "control", and a default key/button and then
	 *  either gets an event when the control is pressed, or checks button/key presses against it. This allows the input
	 *  mapped to a control to change.
	 * 
	 * @extends save.ISavable
	 * @since 0.0.15-alpha
	 */
	var controls = {};

	/** The mappings of controls to their respective key or button.
	 * 
	 * The key of this object is the name of the control, and the value is a two element array.
	 *  The first element is the keycode of the key, and the second a button representation.
	 * @type object
	 * @private
	 */
	var _mappings = {};
	
	/** A constant used when firing the `{@link dusk.controls.controlPressed}` event, indicating that a key was pressed.
	 * @type integer
	 * @constant
	 * @value 0
	 */
	controls.TYPE_KEY = 0;
	/** A constant used when firing the `{@link dusk.controls.controlPressed}` event,
	 *   indicating that a controller button was pressed.
	 * @type integer
	 * @constant
	 * @value 1
	 */
	controls.TYPE_BUTTON = 1;
	/** A constant used when firing the `{@link dusk.controls.controlPressed}` event, indicating that an axis was
	 *  triggered.
	 * @type integer
	 * @constant
	 * @value 2
	 */
	controls.TYPE_AXIS = 2;
	
	/** Fired when a key or button control has been activated, axes are not supported.
	 * 
	 * The event object contains three properties.
	 *  `type`; one of the `TYPE_*` constants indicating what was pressed;
	 *  `control`, a string with the name of the control.
	 * 	The third property is either `buttonEvent` or `keyEvent` depending on what was pressed.
	 *   This is either a keyPress or buttonPress event.
	 * @type EventDispatcher
	 */
	controls.controlPressed = new EventDispatcher("controls.controlPressed");

	/** Adds a new control, with the specified default key/button presses.
	 * 
	 * If the control is already registered, this does nothing.
	 * @param {string} name The name of the controll to add.
	 * @param {?integer} defaultKey The default key to fire this control on, as a keycode.
	 * @param {?integer|string} defaultButton The default button to fire this control on,
	 *  either a button ID, or a axis description.
	 */
	controls.addControl = function(name, defaultKey, defaultButton) {
		if(name in _mappings) return;
		
		_mappings[name] = [
			defaultKey===undefined?null:defaultKey,
			defaultButton===undefined?null:defaultButton
		];
	};

	/** Returns the buttons control mappings assigned to that control.
	 * 
	 * Returns an array of the form `[key, button]`.
	 * @param {string} name The control to look up.
	 * @return {?array} The bindings to that control, or null if it is not set.
	 * @since 0.0.17-alpha
	 */
	controls.lookupControl = function(name) {
		if(!(name in _mappings)) return null;
		return _mappings[name];
	};

	/** Registers a key to a control; when that key is pressed, the control will fire.
	 * @param {string} name The name of the control to add the key to.
	 * @param {integer} key The key to set the control to, as a keycode.
	 */
	controls.mapKey = function(name, key) {
		if(!(name in _mappings)) return;
		_mappings[name][0] = key;
	};

	/** Registers a button or axis to a control; 
	 *   when that button is pressed, or the axis is greater than the threshold, the control will fire.
	 * @param {string} name The name of the control to add the button/axis to.
	 * @param {integer|string} button The button ID, or the axis description to register to the control.
	 */
	controls.mapButton = function(name, button) {
		if(!(name in _mappings)) return;
		_mappings[name][1] = button;
	};

	/** Checks if a button or a key matches the specified control.
	 * 
	 * If either of the specified values match the control, then this will be true.
	 * @param {string} name The name of the control to check.
	 * @param {integer} key The keycode of the key to check.
	 * @param {integer|string} button The button ID or an axis description to check.
	 * @return {boolean} Whether either the button or the key match the specified control.
	 */
	controls.check = function(name, key, button) {
		return controls.checkKey(name, key) || controls.checkButton(name, button);
	};

	/** Checks if a key matches the specified control.
	 * @param {string} name The control to check.
	 * @param {integer} key The keycode to check.
	 * @return {boolean} Whether the specified key is the same key used to trigger the control.
	 */
	controls.checkKey = function(name, key) {
		if(!(name in _mappings) || key == null || key == undefined) return false;
		
		return _mappings[name][0] == key;
	};

	/** Checks if a button or axis description matches the specified control.
	 * @param {string} name The control to check.
	 * @param {integer|string} button The axis or button to check.
	 * @return {boolean} Whether the specified button or axis matches the control.
	 */
	controls.checkButton = function(name, button) {
		if(!(name in _mappings) || button == null || button == undefined) return false;
		
		return _mappings[name][1] == button;
	};

	/** Given the name of a control, returns whether the control is currently active.
	 * @param {string} name The name of the control to check.
	 * @return {boolean} Whether the control is active.
	 */
	controls.controlActive = function(name) {
		if(!(name in _mappings)) return false;
		
		return keyboard.isKeyPressed(_mappings[name][0]) || gamepad.isButtonPressed(_mappings[name][1]);
	};
	
	/** Used internally to handle the `{@link keyboard.keyPress}` event.
	 *	This will check to see if a control is fired from the keypress.
	 * @param {object} e The keyPress event object.
	 * @private
	 */
	var _keyPressed = function(e) {
		for(var m in _mappings) {
			if(_mappings[m][0] == e.keyCode) {
				var toFire = {};
				toFire.keyEvent = e;
				toFire.type = controls.TYPE_KEY;
				toFire.control = m;
				
				controls.controlPressed.fire(toFire);
			}
		}
		
		return true;
	};
	keyboard.keyPress.listen(_keyPressed);
	
	/** Used internally to handle the `{@link dusk.controls.buttonPress}` event.
	 * 	This will check to see if a button, and only a button, control is fired.
	 * @param {object} e The buttonPress event object.
	 * @private
	 */
	var _buttonPressed = function(e) {
		for(var m in _mappings) {
			if(_mappings[m][1] == e.which) {
				var toFire = {};
				toFire.buttonEvent = e;
				toFire.type = controls.TYPE_BUTTON;
				toFire.control = m;
				
				controls.controlPressed.fire(toFire);
			}
		}
	};
	gamepad.buttonPress.listen(_buttonPressed);
	
	/** Saves the bindings to a save source.
	 * 
	 * Type can only be `"bindings"`, everything else is ignored. The argument is an array of what controls should have
	 *  their bindings saved. If it contains `"*"` then all keybindings are saved.
	 * 
	 * @param {string} type The type of thing to save; must be `"bindings"`.
	 * @param {array} arg The argument to the save, as described above.
	 * @return {object} Save data that can be loaded later.
	 * @since 0.0.21-alpha
	 */
	controls.save = function(type, arg) {
		if(type == "bindings") {
			var out = {};
			
			if(!arg || arg.indexOf("*") !== -1) {
				for(p in _mappings) {
					out[p] = _mappings[p];
				}
			}else{
				for(var i = arg.length-1; i >= 0; i --) {
					if(_mappings[arg[p]]) {
						out[arg[i]] = _mappings[arg[i]];
					}
				}
			}
			
			return out;
		}
	};
	
	/** Restores data that was saved via `{@link dusk.controls.save}`.
	 * 
	 * @param {object} data The data that was saved.
	 * @param {string} type The type of data that was saved.
	 * @param {array} arg The argument that was used in saving.
	 * @since 0.0.21-alpha
	 */
	controls.load = function(data, type, arg) {
		if(type == "bindings") {
			for(var p in data) {
				this.addControl(p);
				this.mapKey(p, data[p][0]);
				this.mapButton(p, data[p][1]);
			}
		}
	};
	
	Object.seal(controls);
	
	return controls;
})());
