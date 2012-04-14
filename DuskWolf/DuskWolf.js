//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: DuskWolf
 * 
 * This is the DuskWolf game engine. 
 * 
 * The loader loads this class as a global object named "duskWolf", to access these constants you just need to read that.
 * 
 * Uh, as for general documentation of the project, names starting with a "_" are private, and you shouldn't be using them unless you are directly editing the class.
 * 
 * The DuskWolf engine is created by SavageWolf (Ross Brunton) who can be contacted by email at savagewolf8@gmail.com if you so desire.
 * 
 * You could read readme.md for more information about the engine, but I doubt you'd be able to figure out that you can open it in a text editor.
 */
window.DuskWolf = function() {};

/** Function: error
 * 
 * This traces an error message if <logLevel> is 1 or above. You should keep an eye out for these.
 * 
 * An error is considered to be something that should NOT happen, and that will probably break something else.
 * 
 * Params:
 * 	text - [string] The error to be traced.
 */
DuskWolf.prototype.error = function(text) {
	if(this.logLevel >= 1) console.error(text);
	if(this.htmlLogLevel >= 1 && this.logElem) $("#"+this.logElem).append("<div style='color:#990000'>"+text+"</div>");
}

/** Function: warn
 * 
 * This traces a warning message if <logLevel> is 2 or above.
 * 
 * A warning is something that is probably a bad idea, but doesn't exactly break something.
 * 
 * Params:
 * 	text - [string] The warning to be traced.
 */
DuskWolf.prototype.warn = function(text){
	if(this.logLevel >= 2) console.warn(text);
	if(this.htmlLogLevel >= 2 && this.logElem) $("#"+this.logElem).append("<div style='color:#999900'>"+text+"</div>");
}

/** Function: info
 * 
 * This traces a message if <logLevel> is 3 or above. Use this for anything interesting that happens!
 * 
 * Params:
 * 	text - [string] The message to be traced.
 */
DuskWolf.prototype.info = function(text) {
	if(this.logLevel >= 3) console.info(text);
	if(this.htmlLogLevel >= 3 && this.logElem) $("#"+this.logElem).append("<div style='color:#000099'>"+text+"</div>");
}

/** Function: log
 * 
 * This traces a message if <logLevel> is 4 or above. This should be used for your debugging.
 * 
 * Params:
 * 	text - [string] The message to be traced.
 */
DuskWolf.prototype.log = function(text) {
	if(this.logLevel >= 4) console.log(text);
	if(this.htmlLogLevel >= 4 && this.logElem) $("#"+this.logElem).append("<div style='color:#999999'>"+text+"</div>");
}

/** Constant: logLevel
 * 
 * [number] This determines what output functions print their output to the console or not. Anything below or equal to this number will be sent to the console.
 * 
 * To access the console in Chrome(ium) you just need to hit CTRL+SHIFT+J, in Firefox you need to install Firebug.
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
 * [string] Version of the DW engine. Does not have to be a dot seperated list of numbers or anything, any string will do.
 */
DuskWolf.prototype.ver = "0.0.6-alpha";

/** Constant: verId
 * [number] Version of the DW engine, this may not be human readable, and should be used to check if a save file is older than a certain version, or something. It is assumed that later numbers are newer versions.
 */
DuskWolf.prototype.verId = 6;

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
DuskWolf.prototype.frameRate = 30;

/** Constant: canvas
 * [string] The name of the HTML canvas object SimpleGui uses.
 * 
 * See:
 * 	<mods.SimpleGui>
 */
DuskWolf.prototype.canvas = "canvas";

/** Constant: logElem
 * [string] The name of the HTML div that this will output to based on htmlLogLevel. Leave it blank if there is none.
 */
DuskWolf.prototype.logElem = "dwlog";

/** Constant: dev
 * [boolean] If true, then some features for developers are added, such as no caching for scripts and FPS info.
 */
DuskWolf.prototype.dev = true;
