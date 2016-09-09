//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** A number of different namespaces that handle getting input from the user in various forms.
 *
 * There is also `{@link dusk.input.Interaction}` that takes all these different sources, and fires a single event for
 *  them.
 * 
 * Also included is a controls system `{@link dusk.input.Controls}` which abstracts this away, and allows you to specify
 *  for example a "jump" control that can be triggered from a number of different ways (keyboard or gamepad).
 *
 * @namespace
 * @name input
 * @memberof dusk
 */

load.provide("dusk.input.controls", function() {
	var keyboard = load.require("dusk.input.keyboard");
	var gamepad = load.require("dusk.input.gamepad");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var frameTicker = load.require("dusk.utils.frameTicker");
	var options = load.require("dusk.options");
	var interaction = load.require("dusk.input.interaction");
	var layouts = load.require("dusk.input.layouts");
	
	/** Provides a simple way to describe changeable control schemes.
	 * 
	 * How control mapping works is that code registers the name of a "control", and a default key/button and then
	 *  either gets an event when the control is pressed, or checks button/key presses against it. This allows the input
	 *  mapped to a control to change.
	 * 
	 * Controls can also be "translated". Suppose you want three buttons for jump, attack and shoot. You don't
	 *  particularly care what the actual keys are, but want them to be the three keys on the left of the keyboard.
	 *  On a QWERTY keyboard these would be A, S and D, but you want to be able to support multiple layouts. This is
	 *  where translation comes in. On any key you want to be translated into another layout, when adding them you
	 *  specify the layout the default is in. Then you can ask the user for their keyboard layout and call `translate`
	 *  with it. This will convert all controls that the user hasn't changed themselves from the layout they were added
	 *  with to the one the user has chosen.
	 * 
	 * @extends save.ISavable
	 * @since 0.0.15-alpha
	 */
	var controls = {};
	
	/** The mappings of controls to their respective key or button.
	 * 
	 * The key of this object is the name of the control, and the value is a two element array.
	 *  In order, the values in this array mean:
	 *  - The current keycode that this control will be triggered on.
	 *  - The current button representation that this control will be triggered on.
	 *  - A boolean representing whether this control has changed from its defaults.
	 *  - Its default key.
	 *  - Its default button representation.
	 *  - If available, the translation of the default key or "none" if it isn't.
	 * @type object
	 * @private
	 */
	var _mappings = {};
	
	/** A constant used when firing the `controlPressed` event, indicating that a key was pressed.
	 * @type integer
	 * @constant
	 * @value 0
	 */
	controls.TYPE_KEY = 0;
	/** A constant used when firing the `{@link dusk.input.controls.controlPressed}` event,
	 *   indicating that a controller button was pressed.
	 * @type integer
	 * @constant
	 * @value 1
	 */
	controls.TYPE_BUTTON = 1;
	/** A constant used when firing the `{@link dusk.input.controls.controlPressed}` event, indicating that an axis was
	 *  triggered.
	 * @type integer
	 * @constant
	 * @value 2
	 */
	controls.TYPE_AXIS = 2;
	
	/** Fired when a key or button control has been activated.
	 * 
	 * The event object contains three properties.
	 *  `type`; one of the `TYPE_*` constants indicating what was pressed;
	 *  `control`, a string with the name of the control.
	 * 	The third property is either `buttonEvent` or `keyEvent` depending on what was pressed.
	 *   This is either a keyPress or buttonPress event.
	 * @type EventDispatcher
	 */
	controls.controlPressed = new EventDispatcher("dusk.input.controls.controlPressed");
	
	/** Adds a new control, with the specified default key/button presses.
	 * 
	 * If the control is already registered, this does nothing.
	 * @param {string} name The name of the controll to add.
	 * @param {integer|string} defaultKey The default key to fire this control on, as a keycode or name.
	 * @param {?integer|string} defaultButton The default button to fire this control on, either a button ID, or an
	 *  axis description.
	 * @param {?string} The translation (I.E. layout) that the key was specified in, but only if you want this control
	 *  to be translated.
	 * @return {string} The name of the control that was just added.
	 */
	controls.addControl = function(name, defaultKey, defaultButton, translation) {
		if(name in _mappings) return name;
		
		if(typeof defaultKey == "string") {
			defaultKey = keyboard.findCode(defaultKey);
			if(defaultKey == -1) console.error("Invalid key name for "+defaultKey);
		}
		
		_mappings[name] = [
			defaultKey===undefined?null:defaultKey,
			defaultButton===undefined?null:defaultButton,
			false,
			defaultKey===undefined?null:defaultKey,
			defaultButton===undefined?null:defaultButton,
			translation?translation:"none"
		];
		
		return name;
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
		return _mappings[name].slice(0, 2);
	};
	
	/** Registers a key to a control; when that key is pressed, the control will fire.
	 * @param {string} name The name of the control to add the key to.
	 * @param {integer|string} key The key to set the control to, as a keycode or name.
	 */
	controls.mapKey = function(name, key) {
		if(!(name in _mappings)) return;
		
		if(typeof key == "string") {
			key = keyboard.findCode(key);
			if(key == -1) console.error("Invalid key name for "+name);
		}
		
		_mappings[name][0] = key;
		_mappings[name][2] = true;
	};
	
	/** Registers a button or axis to a control; when that button is pressed, or the axis is greater than the threshold,
	 *  the control will fire.
	 * @param {string} name The name of the control to add the button/axis to.
	 * @param {integer|string} button The button ID, or the axis description to register to the control.
	 */
	controls.mapButton = function(name, button) {
		if(!(name in _mappings)) return;
		_mappings[name][1] = button;
		_mappings[name][2] = true;
	};
	
	/** Translate all unchanged from default controls to the specified layout.
	 * @param {string} name The layout to translate to.
	 */
	controls.translate = function(layout) {
		for(var c in _mappings) {
			if(!_mappings[c][2] && _mappings[c][5] != "none") {
				_mappings[c][0] = layouts.translate(_mappings[c][3], _mappings[c][5], layout);
			}
		}
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
	
	/** Given an event from `{@link dusk.input.interaction.on}` it will check if it matches a control, and return an
	 *  array of all controls that match.
	 * 
	 * @param {object} e The event object.
	 * @return {array} All controls that match this event.
	 * @since 0.0.21-alpha
	 */
	controls.interactionControl = function(inter) {
		var out = [];
		for(var m in _mappings) {
			if(inter.type == interaction.KEY_DOWN) {
				if(inter.which == _mappings[m][0]) out.push(m);
			}
			
			if(inter.type == interaction.BUTTON_DOWN) {
				if(inter.which == _mappings[m][1]) out.push(m);
			}
		}
		return out;
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
				toFire.root = e.root;
				toFire.which = e.keyCode;
				
				controls.controlPressed.fire(toFire, m);
			}
		}
		
		return true;
	};
	keyboard.keyPress.listen(_keyPressed);
	
	/** Used internally to handle the `{@link dusk.input.controls.buttonPress}` event.
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
				toFire.root = "*";
				toFire.which = e.which;
				toFire.axis = e.axis;
				
				controls.controlPressed.fire(toFire, m);
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
	 * @param {function(*):integer|array} The reffing function.
	 * @return {object} Save data that can be loaded later.
	 * @since 0.0.21-alpha
	 */
	controls.save = function(type, arg, ref) {
		if(type == "bindings") {
			var out = {};
			
			if(!arg || arg.indexOf("*") !== -1) {
				for(p in _mappings) {
					out[p] = ref(_mappings[p]);
				}
			}else{
				for(var i = arg.length-1; i >= 0; i --) {
					if(_mappings[arg[p]]) {
						out[arg[i]] = ref(_mappings[arg[i]]);
					}
				}
			}
			
			return out;
		}
	};
	
	/** Restores data that was saved via `save`.
	 * 
	 * @param {object} data The data that was saved.
	 * @param {string} type The type of data that was saved.
	 * @param {array} arg The argument that was used in saving.
	 * @param {function(array|integer):*} The unreffing function.
	 * @since 0.0.21-alpha
	 */
	controls.load = function(data, type, arg, unref) {
		if(type == "bindings") {
			for(var p in data) {
				_mappings[p] = unref(data[p]);
				//this.addControl(p);
				//this.mapKey(p, data[p][0]);
				//this.mapButton(p, data[p][1]);
			}
		}
	};
	
	return controls;
});
