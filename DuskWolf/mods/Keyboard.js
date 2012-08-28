//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.mods.keyboard");

/** Class: mods.Keyboard
 * 
 * This module is in charge of the keyboard, letting you react to keypresses.
 * 
 * Inheritance:
 * 	mods.Keyboard { <mods.IModule>
 * 
 * In JavaScript each character has a unique number, the keycode, which is used to identify them.
 * 	There is a list of vars from this module that list the keycodes for all the main keys.
 * 	For example, to check if the "a" key is pressed, you can use: {"a":"if-key", "key":"#KEYC(a);", "then":[...]}.
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
 * Provided HashFunctions:
 * 
 * > #KCODE(name);
 *	This takes in the name of a key, and returns the keycode that represents that key. Not case sensitive.
 *
 * > #CKEY(code);
 *	This takes in a keycode, and returns the name of the key that has it.
 * 
 */

/** Function: mods.Keyboard
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 */
dusk.mods.keyboard.init = function() {
	dusk.events.registerKeyHandler("KeyboardKey", this._handleKeypress, this);
	dusk.events.registerKeyUpHandler("KeyboardUpKey", this._handleKeyup, this);
	
	/*- Variable: _keys
	 * [object] A list of keys that are pressed. It is an array with the indexes being the keycodes.
	 */
	this._keys = {};
	
	/*- Variable: _codes
	 * [object] An object with the properties the same as keycodes.
	 * 	Each property key is a number, which contains a two element array.
	 * 	The first element is a representation of the character, and the second is a boolean, which is true if the character is printable. 
	 */
	this._codes = {
		"8":["BACKSPACE", false],
		"9":["TAB", false],
		"13":["ENTER", false],
		
		"32":[" ", true],
		
		"37":["LEFT", false],
		"38":["UP", false],
		"39":["RIGHT", false],
		"40":["DOWN", false],
		
		"48":["0", true],
		"49":["1", true],
		"50":["2", true],
		"51":["3", true],
		"52":["4", true],
		"53":["5", true],
		"54":["6", true],
		"55":["7", true],
		"56":["8", true],
		"57":["9", true],
		
		"65":["a", true],
		"66":["b", true],
		"67":["c", true],
		"68":["d", true],
		"69":["e", true],
		"70":["f", true],
		"71":["g", true],
		"72":["h", true],
		"73":["i", true],
		"74":["j", true],
		"75":["k", true],
		"76":["l", true],
		"77":["m", true],
		"78":["n", true],
		"79":["o", true],
		"80":["p", true],
		"81":["q", true],
		"82":["r", true],
		"83":["s", true],
		"84":["t", true],
		"85":["u", true],
		"86":["v", true],
		"87":["w", true],
		"88":["x", true],
		"89":["y", true],
		"90":["z", true],
	};
	
	dusk.events.registerAction("if-key", this._ifkey, this, [["key", true, "NUM"], ["then", false, "DWC"], ["else", false, "DWC"]]);
	
	dusk.events.registerHashFunct("KCODE", this._keyCode, this);
	dusk.events.registerHashFunct("CKEY", this._codeKey, this);
};

/** Function: addActions
 * 
 * Registers the actions this provides, see the class description for a list of avalable ones that can be used.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
dusk.mods.keyboard.addActions = function() {
	
};

/*- Function: _handleKeypress
 * 
 * This handles the keypress event, which is obviously something this module has to do.
 * 
 * Params:
 * 	e		- [object] A jQuery keypress event object.
 */
dusk.mods.keyboard._handleKeypress = function(e) {
	dusk.events.run([{"a":"fire", "key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "alt":e.altKey, "event":"key-event-down"}], "_keyboard");
	this._keys[e.keyCode] = true;
};

/*- Function: _handleKeyup
 * 
 * This handles the keyup event, which is dispatched when a pressed key is released.
 * 
 * Params:
 * 	e		- [object] A jQuery keyup event object.
 */
dusk.mods.keyboard._handleKeyup = function(e) {
	dusk.events.run([{"a":"fire", "key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "alt":e.altKey, "event":"key-event-up"}], "_keyboard");
	this._keys[e.keyCode] = false;
};

/** Function: isKeyPressed
 * 
 * This checks whether the key is pressed, and returns whether it is pressed.
 * 
 * Params:
 * 	code	- [number] A keycode to check.
 * 
 * Returns:
 * 	[Boolean] Whether the key is pressed.
 */
dusk.mods.keyboard.isKeyPressed = function(code) {
	if(!(code in this._keys)) return false;
	
	return this._keys[code];
};

/** Function: lookupCode
 * 
 * This looks up a keycode, and returns the letter it represents, as well as some other stuff.
 * 
 * Params:
 * 	code	- [number] A keycode to lookup.
 * 
 * Returns:
 * 	[array] Information on that key. The first entry is a string representation, the second a boolean saying if it is printable.
 */
dusk.mods.keyboard.lookupCode = function(code) {
	if(!(code in this._codes)) return ["UNKNOWN", false];
	
	return this._codes[code];
};

/*- Function: _ifKey
 * 
 * Used internally to handle the "ifKey" action.
 *	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 *	data		- [object] A "ifKey" action.
 */
dusk.mods.keyboard._ifKey = function(a) {
	if(!a.key){throw new dusk.errors.PropertyMissing(a.a, "key");}
	
	if(this.isKeyPressed(a.key)) {
		if("then" in a) this.run(a.then, dusk.events.thread);
	}else if("else" in a) this.run(a["else"], dusk.events.thread);
};

/*- Function: _keyCode
 * 
 * [string] Used internally to handle the "KEYC" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 * 	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
dusk.mods.keyboard._keyCode = function(name, args) {
	if(!args.length){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	
	for(var k in this._codes){
		if(this._codes[k][0].toUpperCase() == args[0].toUpperCase()) {
			return k;
		}
	}
	
	return -1;
};

/*- Function: _codeKey
 * 
 * [string] Used internally to handle the "CKEY" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 * 	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
dusk.mods.keyboard._codeKey = function(name, args) {
	if(!args.length){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	
	if(this._codes[args[0]] !== undefined) return this._codes[args[0]][0];
	
	return "";
};

dusk.mods.keyboard.init();
