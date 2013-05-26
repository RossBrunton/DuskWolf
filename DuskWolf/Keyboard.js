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

$(document).bind("keydown", function je_keydown(e){
	if(!dusk.keyboard._keys[e.keyCode]) 
		dusk.keyboard.keyPress.fire(e);
});
$(document).bind("keyup", function je_keyup(e){dusk.keyboard.keyUp.fire(e);});

/** An object describing the properties of keys relative to their keycodes.
 * 
 * Each property in this object is a three element array, the first being the "name" of the key, 
 *  the second being a boolean indicating whether it is printable or not,
 *  and the third being a smaller (upto 3 chars) name of the key.
 * 
 * Property names of this object are the same as the keycodes they describe.
 * 
 * @type object
 * @private
 */
dusk.keyboard._codes = {
	"8":["BACKSPACE", false, "BS"],
	"9":["TAB", false, "TAB"],
	"13":["ENTER", false, "ENT"],
	"16":["SHIFT", false, "SFT"],
	"17":["CTRL", false, "CTL"],
	"18":["ALT", false, "ALT"],
	"19":["PAUSE", false, "PAU"],
	"20":["CAPS_LOCK", false, "CAP"],
	"27":["ESCAPE", false, "ESC"],
	"33":["PAGEUP", false, "PGU"],
	"34":["PAGEDOWN", false, "PGD"],
	"35":["END", false, "END"],
	"36":["HOME", false, "HME"],
	"45":["INSERT", false, "INS"],
	"46":["DELETE", false, "DEL"],
	"91":["SUPER", false, "SPR"],
	"92":["SUPER", false, "SPR"],
	
	"32":[" ", true, "SPC"],
	
	"37":["LEFT", false, "LFT"],
	"38":["UP", false, "UP"],
	"39":["RIGHT", false, "RGT"],
	"40":["DOWN", false, "DWN"],
	
	"48":["0", true, "0"],
	"49":["1", true, "1"],
	"50":["2", true, "2"],
	"51":["3", true, "3"],
	"52":["4", true, "4"],
	"53":["5", true, "5"],
	"54":["6", true, "6"],
	"55":["7", true, "7"],
	"56":["8", true, "8"],
	"57":["9", true, "9"],
	
	"65":["a", true, "A"],
	"66":["b", true, "B"],
	"67":["c", true, "C"],
	"68":["d", true, "D"],
	"69":["e", true, "E"],
	"70":["f", true, "F"],
	"71":["g", true, "G"],
	"72":["h", true, "H"],
	"73":["i", true, "I"],
	"74":["j", true, "J"],
	"75":["k", true, "K"],
	"76":["l", true, "L"],
	"77":["m", true, "M"],
	"78":["n", true, "N"],
	"79":["o", true, "O"],
	"80":["p", true, "P"],
	"81":["q", true, "Q"],
	"82":["r", true, "R"],
	"83":["s", true, "S"],
	"84":["t", true, "T"],
	"85":["u", true, "U"],
	"86":["v", true, "V"],
	"87":["w", true, "W"],
	"88":["x", true, "X"],
	"89":["y", true, "Y"],
	"90":["z", true, "Z"],
	
	"96":["0", true, "N0"],
	"97":["1", true, "N1"],
	"98":["2", true, "N2"],
	"99":["3", true, "N3"],
	"100":["4", true, "N4"],
	"101":["5", true, "N5"],
	"102":["6", true, "N6"],
	"103":["7", true, "N7"],
	"104":["8", true, "N8"],
	"105":["9", true, "N9"],
	
	"106":["MULTIPLY", false, "MUL"],
	"107":["ADD", false, "ADD"],
	"109":["SUBTRACT", false, "SUB"],
	"110":["DECIMAL_POINT", false, "DPT"],
	"111":["DIVIDE", false, "DIV"],
	
	"112":["F1", false, "F1"],
	"113":["F2", false, "F2"],
	"114":["F3", false, "F3"],
	"115":["F4", false, "F4"],
	"116":["F5", false, "F5"],
	"117":["F6", false, "F6"],
	"118":["F7", false, "F7"],
	"119":["F8", false, "F8"],
	"120":["F9", false, "F9"],
	"121":["F10", false, "F10"],
	"122":["F11", false, "F11"],
	"123":["F12", false, "F12"],
	
	"144":["NUM_LOCK", false, "NUM"],
	"145":["SCROLL_LOCK", false, "SCR"],
	
	"186":[";", true, ";"],
	"187":["=", true, "="],
	"188":[",", true, ","],
	"189":["-", true, "-"],
	"190":[".", true, "."],
	"191":["/", true, "/"],
	"192":["`", true, "`"],
	"219":["[", true, "["],
	"220":["\\", true, "\\"],
	"221":["]", true, "]"],
	"222":["'", true, "'"],
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
 * @param {integer} code A keycode to check.
 * @return {boolean} Whether the specified key is currently pressed.
 */
dusk.keyboard.isKeyPressed = function(code) {
	if(!(code in this._keys)) return false;
	
	return this._keys[code];
};

/** Given a keycode, this returns information about that key.
 * 
 * It returns an array; the first element is the name of the key,
 *  the second is a boolean indicating whether it is printable,
 *  and the third is a shorthand representation of the key.
 * 
 * For all "printable" keys, the "name" is what the user would expect to type when pressing that key.
 * 
 * @param {integer} code A keycode to look up.
 * @return {array} Information on that key.
 */
dusk.keyboard.lookupCode = function(code) {
	if(!(code in this._codes)) return ["UNKNOWN", false, "???"];
	
	return this._codes[code];
};

//Block keys from moving page
document.onkeydown = function(e) {
	if([37, 38, 39, 40, 9, 13, 32].indexOf(e.keyCode) !== -1) return false;
};

Object.seal(dusk.keyboard);
