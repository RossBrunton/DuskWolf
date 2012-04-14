//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Keyboard
 * 
 * This module is in charge of the keyboard, letting you react to keypresses.
 * 
 * Inheritance:
 * 	mods.Keyboard { <mods.IModule>
 * 
 * In JavaScript each character has a unique number, the keycode, which is used to identify them.
 * 	There is a list of vars from this module that list the keycodes for all the main keys.
 * 	For example, to check if the "a" key is pressed, you can use: {"a":"if-key", "key":"$key-a;", "then":[...]}.
 * 
 * Provided Actions:
 * 
 * > {"a":"if-key", "key":123, ("then":[],) ("else":[])}
 * Checks if the key specified by the JS keycode "key" is pressed.
 * 	If so, then the "then" actions are ran, else, the "else" actions are ran.
 * 
 * Provided Events:
 * 
 * > {"a":"fire", "event":"key-event-down", "key":123, "shift":false, "ctrl":false, "alt":false}
 * This is fired when the key specified by the keycode is pressed.
 * 	The "ctrl", "alt", and "shift" properties depend on whether those keys were pressed as modifiers.
 * 
 *  > {"a":"fire", "event":"key-event-up", "key":123, "shift":false, "ctrl":false, "alt":false}
 * This is fired when the key specified by the keycode is released after having been pressed.
 * 	The "ctrl", "alt", and "shift" properties depend on whether those keys were pressed as modifiers.
 * 
 * Variables:
 * 	> key-a
 * 	> key-b
 * 	> ...
 * 	These are the keycodes for all the main keys.
 */

/** Function: mods.Keyboard
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
 */
mods.Keyboard = function(events) {
	mods.IModule.call(this, events);
	
	this._events.registerKeyHandler("KeyboardKey", this._handleKeypress, this);
	this._events.registerKeyUpHandler("KeyboardUpKey", this._handleKeyup, this);
	
	this._keys = {};
	
	this._events.setVar("key-a", 65);
	this._events.setVar("key-b", 66);
	this._events.setVar("key-c", 67);
};
mods.Keyboard.prototype = new mods.IModule();
mods.Keyboard.constructor = mods.Keyboard;

/** Function: addActions
 * 
 * Registers the actions this provides, see the class description for a list of avalable ones that can be used.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Keyboard.prototype.addActions = function() {
	this._events.registerAction("if-key", this._ifkey, this);
};

/** Function: _handleKeypress
 * 
 * This handles the keypress event, which is obviously something this module has to do.
 * 
 * Params:
 * 	e	- [object] A jQuery keypress event object.
 */
mods.Keyboard.prototype._handleKeypress = function(e) {
	this._events.run([{"a":"fire", "key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "alt":e.altKey, "event":"key-event-down"}], "_keyboard");
	this._keys[e.keyCode] = true;
};

/** Function: _handleKeyup
 * 
 * This handles the keyup event, which is dispatched when a pressed key is released.
 * 
 * Params:
 * 	e	- [object] A jQuery keyup event object.
 */
mods.Keyboard.prototype._handleKeyup = function(e) {
	this._events.run([{"a":"fire", "key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "alt":e.altKey, "event":"key-event-up"}], "_keyboard");
	this._keys[e.keyCode] = false;
};

mods.Keyboard.prototype.isKeyPressed = function(code) {
	if(!(code in this._keys)) return false;
	
	return this._keys[code];
};

mods.Keyboard.prototype._ifKey = function(a) {
	if(!what.key){duskWolf.error("No key to check.");return;}
	
	if(this.isKeyPressed(a.key)) {
		if("then" in a) this.run(a.then, this._events.thread);
	}else if("else" in a) this.run(what["else"], this._events.thread);
};
