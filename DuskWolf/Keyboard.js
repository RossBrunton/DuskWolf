//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk.keyboard");

/** @namespace dusk.keyboard
 * @name dusk.keyboard
 * 
 * @description This module contains methods for interacting with the keyboard.
 */
	
/** An object describing which keys are currently pressed.
 * 
 * The keys of the object, are the keycodes of each key that has been pressed, with a true or false value.
 * 
 * @type object
 * @private
 */
dusk.keyboard._keys = {};

/** An event dispatcher which fires when a key is pressed.
 * 
 * The event object is a JQuery `keydown` event.
 * 
 * @type dusk.EventDispatcher
 * @since 0.0.14-alpha
 */
dusk.keyboard.keyPress = new dusk.EventDispatcher("dusk.keyboard.keyPress");

/** An event dispatcher which fires when a key is released after being pressed.
 * 
 * The event object is a JQuery `keyup` event.
 * 
 * @type dusk.EventDispatcher
 * @since 0.0.14-alpha
 */
dusk.keyboard.keyUp = new dusk.EventDispatcher("dusk.keyboard.keyUp");

$(document).bind("keydown", function je_keydown(e){dusk.keyboard.keyPress.fire(e);});
$(document).bind("keyup", function je_keyup(e){dusk.keyboard.keyUp.fire(e);});

/** An object describing the properties of keys relative to their keycodes.
 * 
 * Each property in this object is a two element array, the first being the "name" of the key, the second being a boolean indecating whether it is printable or not.
 * 
 * Property names of this object are the same as the keycodes they describe.
 * 
 * @type object
 * @private
 */
this._codes = {
	"8":["BACKSPACE", false],
	"9":["TAB", false],
	"13":["ENTER", false],
	"16":["SHIFT", false],
	"17":["CTRL", false],
	"18":["ALT", false],
	"27":["ESCAPE", false],
	"33":["PAGEUP", false],
	"34":["PAGEDOWN", false],
	"35":["END", false],
	"36":["HOME", false],
	"45":["INSERT", false],
	"46":["DELETE", false],
	"91":["SUPER", false],
	"92":["SUPER", false],
	
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

/** Handles a keypress internally. This enables the module to track whether a key is pressed or not.
 * 
 * @param {object} e An event dispatched by `{@link dusk.keyboard.keyPress}`.
 * @private
 */
dusk.keyboard._handleKeypress = function(e) {
	this._keys[e.keyCode] = true;
};
dusk.keyboard.keyPress.listen(dusk.keyboard._handleKeypress, dusk.keyboard);

/** Handles a key release event internally. This enables the module to track whether a key is pressed or not.
 * 
 * @param {object} e An event dispatched by `{@link dusk.keyboard.keyUp}`.
 * @private
 */
dusk.keyboard._handleKeyup = function(e) {
	this._keys[e.keyCode] = false;
};
dusk.keyboard.keyUp.listen(dusk.keyboard._handleKeyup, dusk.keyboard);

/** Checks if a key is currently pressed or not.
 * 
 * @param {number} code A keycode to check.
 * @return {boolean} Whether the specified key is currently pressed.
 */
dusk.keyboard.isKeyPressed = function(code) {
	if(!(code in this._keys)) return false;
	
	return this._keys[code];
};

/** Given a keycode, this returns information about that key.
 * 
 * It returns an array; the first element is the name of the key, the second is a boolean indicating whether it is printable.
 * 
 * For all "printable" keys, the "name" is what the user would expect to type when pressing that key.
 * 
 * @param {number} code A keycode to look up.
 * @return {array} Information on that key.
 */
dusk.keyboard.lookupCode = function(code) {
	if(!(code in this._codes)) return ["UNKNOWN", false];
	
	return this._codes[code];
};

//Block keys from moving page
document.onkeydown = function(e) {
	if(e.keyCode >= 37 && e.keyCode <= 40) return false;
};
