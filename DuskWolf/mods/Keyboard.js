//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/**  */
mods.Keyboard = function(events) {
	mods.IModule.call(this, events);
	
	this._events.registerKeyHandler("KeyboardKey", this._handleKeypress, this);
	this._events.registerKeyUpHandler("KeyboardUpKey", this._handleKeyup, this);
	
	this._keys = {}
};
mods.Keyboard.prototype = new mods.IModule();
mods.Keyboard.constructor = mods.Keyboard;
	
mods.Keyboard.prototype.addActions = function() {
	
};

mods.Keyboard.prototype._handleKeypress = function(e) {
	this._events.run([{"a":"fire", "key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "alt":e.altKey, "event":"key-event-down"}], "_keyboard");
	this._keys[e.keyCode] = true;
};

mods.Keyboard.prototype._handleKeyup = function(e) {
	this._events.run([{"a":"fire", "key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "alt":e.altKey, "event":"key-event-up"}], "_keyboard");
	this._keys[e.keyCode] = false;
};

mods.Keyboard.prototype.isKeyPressed = function(code) {
	if(!(code in this._keys))return false;
	
	return this._keys[code];
}
