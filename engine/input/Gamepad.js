//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.input.gamepad", (function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var frameTicker = load.require("dusk.utils.frameTicker");
	var options = load.require("dusk.options");
	
	/** @namespace dusk.input.gamepad
	 * @name dusk.input.gamepad
	 * 
	 * @description Provides an interface for game controllers.
	 * 
	 * Gamepads are automatically detected and set up and consist of buttons and axes. Buttons are numbered from 0 to
	 *  however many buttons there are, and this is the number used to identify them.
	 *
	 * Axes are also numbered, but consist of a scale from -1.0 to 1.0. Gamepads are treated as buttons everywhere in
	 *  this namespace. Rather than being represented as ints, axes are strings. The strings consist of the number of
	 *  the axis followed by either `+` or `-`. The axis will be considered "pressed" when the value of the tilt is
	 *  greater than (where `+` is used) or less than (where `-` is used) than the value of the option
	 *  `gamepad.threshold` (default 0.5).
	 * 
	 * @since 0.0.21-alpha
	 */
	var gamepad = {};

	/** The currently pressed buttons.
	 * 
	 * The index is the ID of the button, and the value is a boolean describing whether the button is pressed or not.
	 * @type array
	 * @private
	 */
	var _buttons = [];
	/** The current state of all the axises.
	 * 
	 * The index is the axis ID, and the value is a number from -1.0 to 1.0 indicating the intensity of the stick.
	 * @type array
	 * @private
	 */
	var _axes = [];

	/** An array with entries for each axis. If true, then the axis is tilted.
	 * @type Array
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _axesTilted = [];
	
	/** Fired when a button on the gamepad is pressed.
	 * 
	 * TThe event object is a `buttonPress` event, which has the property `which`; the button/axis and `axis`; whether
	 *  it is an axis.
	 * 
	 * @type EventDispatcher
	 */
	gamepad.buttonPress = new EventDispatcher("gamepad.buttonPressed");
	/** Fired when a button on the gamepad is released.
	 * 
	 * The event object is a `buttonPress` event, which has the property `which`; the button/axis and `axis`; whether
	 *  it is an axis.
	 * @type EventDispatcher
	 */
	gamepad.buttonUp = new EventDispatcher("gamepad.buttonUp");
	
	//Add gamepad option
	options.register("gamepad.enable", "boolean", true, "Whether gamepads will be used.");
	options.register("gamepad.threshold", "positiveFloat", 0.5,
		"The angle that axis should be tilted to be treated as a button."
	);
	
	/** Checks if a button is pressed, or an axis is tilted.
	 * @param {integer|string} button The button/axis to check, as a button ID or an axis description.
	 * @return {boolean} Whether said button/axis is pressed/tilted.
	 */
	gamepad.isButtonPressed = function(button) {
		if(typeof button == "string") {
			var axis = button.split("+")[0].split("-")[0];
			if(button.indexOf("+") !== -1) {
				if(+button.split("+")[1] < _axes[axis]) return true;
			}else if(button.indexOf("-") !== -1) {
				if(-button.split("-")[1] > _axes[axis]) return true;
			}
			
			return false;
		}
		
		return _buttons[button];
	};
	
	/** Returns the angle of the specified axis.
	 * @param {integer} axis The axis to check.
	 * @return {?float} The tilt of the axis, or null if it doesn't exist.
	 * @since 0.0.21-alpha
	 */
	gamepad.getTilt = function(axis) {
		return _axis[i];
	};
	
	/** Given an entry in the button array thing is pushed.
	 * 
	 * Because apparently you need an object with a pressed property.
	 * @param {GamepadButton|float} The object.
	 * @return {boolean} Whether the button is pressed or not.
	 * @since 0.0.21-alpha
	 * @private
	 */
	var _isPressed = function(b) {
		if (typeof(b) == "object") {
			return b.pressed;
		}
		
		return b > 0.5;
	};
	
	/** Registered on `{@link dusk.utils.frameTicker.onFrame}`.
	 * 	This checks to see if gamepad buttons or pressed, or if axises are tilted,
	 *   and fires the relative events, and updates the relative variables.
	 * @param {object} e The event object.
	 * @private
	 */
	var _frame = function(e) {
		if(document.hidden || document.webkitHidden || document.msHidden) return;
		if(!options.get("gamepad.enable")) return;
		
		var navigatorGetGamepads = navigator.getGamepads || navigator.webkitGetGamepads || function(){return [null];};
		var gp = navigatorGetGamepads.call(navigator)[0];
		
		if(gp) {
			// Buttons
			for(var i = 0; i < gp.buttons.length-1; i ++) {
				if(!_buttons[i] && _isPressed(gp.buttons[i])) {
					gamepad.buttonPress.fire({"which":i, "axis":false}, i);
				}else if(_buttons[i] && !_isPressed(gp.buttons[i])) {
					gamepad.buttonUp.fire({"which":i, "axis":false}, i);
				}
				
				_buttons[i] = _isPressed(gp.buttons[i]);
			}
			
			// Axes
			for(var i = 0; i < gp.axes.length-1; i ++) {
				_axes[i] = gp.axes[i];
				
				var button = i+(gp.axes[i] > 0?"+":"-");
				
				if(gp.axes[i] > options.get("gamepad.threshold")
				|| gp.axes[i] < -options.get("gamepad.threshold")) {
					if(!_axesTilted[i]) {
						_axesTilted[i] = true;
						gamepad.buttonPress.fire({"which":button, "axis":true}, button);
					}
				}else{
					if(_axesTilted[i]) {
						_axesTilted[i] = false;
						gamepad.buttonUp.fire({"which":button, "axis":true}, button);
					}
				}
			}
		}
	};
	frameTicker.onFrame.listen(_frame);
	
	return gamepad;
})());
