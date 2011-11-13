//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: DuskWolf
 * 
 * This is the DuskWolf engine.
 * 
 * The loader loads this class as a global object named "duskWolf", to access these constants you just need to read that.
 * 
 * You could read readme.md for more information, but I doubt you'd be able to figure out that you can open it in a text editor.
 */
window.DuskWolf = function() {
};

/** Function: error
 * 
 * [undefined] This traces an error message if <logLevel> is 1 or above. You should keep an eye out for these.
 * 
 * An error is considered to be something that should NOT happen, and that will probably break something else.
 * 
 * Params:
 * 	text - [string] The error to be traced, it will be converted to a string.
 * 
 * See:
 * 	<DuskWolf.logLevel>
 */
DuskWolf.prototype.error = function(text) {
	if(this.logLevel >= 1) console.error(text);
	if(this.htmlLogLevel >= 1 && this.logElem) $("#"+this.logElem).append("<div style='color:#990000'>"+text+"</div>");
}

/** Function: warn
 * 
 * [undefined] This traces a warning message if <logLevel> is 2 or above.
 * 
 * A warning is something that is probably a bad idea, but doesn't exactly break something.
 * 
 * Params:
 * 	text - [string] The error to be traced, it will be converted to a string.
 * 
 * See:
 * 	<DuskWolf.logLevel>
 */
DuskWolf.prototype.warn = function(text){
	if(this.logLevel >= 2) console.warn(text);
	if(this.htmlLogLevel >= 2 && this.logElem) $("#"+this.logElem).append("<div style='color:#999900'>"+text+"</div>");
}

/** Function: info
 * 
 * [undefined] This traces a message if <logLevel> is 3 or above. Use this for anything interesting that happens!
 * 
 * Params:
 * 	text - [string] The error to be traced, it will be converted to a string.
 * 
 * See:
 * 	<DuskWolf.logLevel>
 */
DuskWolf.prototype.info = function(text) {
	if(this.logLevel >= 3) console.info(text);
	if(this.htmlLogLevel >= 3 && this.logElem) $("#"+this.logElem).append("<div style='color:#000099'>"+text+"</div>");
}

/** Function: log
 * 
 * [undefined] This traces a message if <logLevel> is 4 or above. This should be used for your debugging.
 * 
 * Params:
 * 	text - [string] The error to be traced, it will be converted to a string.
 * 
 * See:
 * 	<DuskWolf.logLevel>
 */
DuskWolf.prototype.log = function(text) {
	if(this.logLevel >= 4) console.log(text);
	if(this.htmlLogLevel >= 4 && this.logElem) $("#"+this.logElem).append("<div style='color:#999999'>"+text+"</div>");
}

/** Constant: logLevel
 * 
 * [number] This determines what output functions work or not. Anything below or equal to this number will be sent to the console.
 * 
 * 1 - error
 * 2 - warning
 * 3 - info
 * 4 - log
 */
DuskWolf.prototype.logLevel = 4;

/** Constant: htmlLogLevel
 * 
 * [number] This determines what output functions will be printed to the HTML element given by <logElem>, the level numbers themselves are the same as <logLevel>.
 */
DuskWolf.prototype.htmlLogLevel = 4;

/** Constant: ver
 * [string] Version of your game. Does not have to be a dot seperated list of numbers or anything, any string will do.
 */
DuskWolf.prototype.ver = "0.0.2-alpha";

/** Constant: verId
 * [number] Version of the game, this may not be human readable, and should be used to check if a save file is older than a certain version, or something. It is assumed that later numbers are newer versions.
 */
DuskWolf.prototype.verId = 2;

/** Constant: gameName
 * [string] Name of the game. 
 */
DuskWolf.prototype.gameName = "DuskWolf";

/** Constant: author
 * [string] Name of the author who made the game. 
 */
DuskWolf.prototype.author = "SavageWolf";

/** Constant: frameRate
 * [number] The frame rate, in frames per second.
 */
DuskWolf.prototype.frameRate =  30;

/** Constant: canvas
 * [string] The name of the HTML canvas object SimpleGui uses.
 * 
 * See:
 * 	<mods.SimpleGui>
 */
DuskWolf.prototype.canvas = "canvas";

/** Constant: logElem
 * [string] The name of the HTML canvas that this will output to based on htmlLogLevel. Leave it blank if there is none.
 */
DuskWolf.prototype.logElem = "dwlog";

/** Constant: gameDir
 * [string] The folder where game assets (images, JSONs etc.) are found.
 */
DuskWolf.prototype.gameDir = "test/Example";
