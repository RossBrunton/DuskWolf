//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk");

//DEPRECIATED
goog.provide("duskWolf");

/** @name dusk
 * @namespace DuskWolf game engine. 
 * 
 * <p>This is the "root" object for DuskWolf, and provides a few functions and configuration thingies.</p>
 * 
 * <p>The DuskWolf engine is created by SavageWolf (Ross Brunton) who can be contacted by email at savagewolf8@gmail.com if you so desire.</p>
 * 
 * <p>You could read readme.md for more information about the engine, but I doubt you'd be able to figure out that you can open it in a text editor.</p>
 * 
 * <p>My naming standard of things are as follows:
 *	<ul>
 *	<li>CapitalLetters denotes a class.</li>
 *	<li>camelCase denotes a public property of an object.</li>
 *	<li>__doubleUnderscore__ denotes a global function, or config var.</li>
 *	<li>_singleUnderscore denotes ether a private or protected function. If documentation for the property exists and is not initiated by "/*-" then it is protected rather than private.</li>
 *	</ul></p>
 */

/** @depreciated Use console */
/*dusk.error = function(text) {
	if(this.logLevel >= 1) console.error(text);
	if(this.htmlLogLevel >= 1 && this.logElem) $("#"+this.logElem).append("<div style='color:#990000'>"+text+"</div>");
}*/

/** @depreciated Use console */
dusk.warn = function(text){
	if(this.logLevel >= 2) console.warn(text);
	if(this.htmlLogLevel >= 2 && this.logElem) $("#"+this.logElem).append("<div style='color:#999900'>"+text+"</div>");
}

/** @depreciated Use console */
dusk.info = function(text) {
	if(this.logLevel >= 3) console.info(text);
	if(this.htmlLogLevel >= 3 && this.logElem) $("#"+this.logElem).append("<div style='color:#000099'>"+text+"</div>");
}

/** @depreciate Use consoled */
dusk.log = function(text) {
	if(this.logLevel >= 4) console.log(text);
	if(this.htmlLogLevel >= 4 && this.logElem) $("#"+this.logElem).append("<div style='color:#999999'>"+text+"</div>");
}

/** @depreciated Use console */
dusk.logLevel = ("__logLevel__" in window)?window.__logLevel__:4;

/** @depreciated Use console */
dusk.htmlLogLevel = ("__htmlLogLevel__" in window)?window.__htmlLogLevel__:4;

/** {string} Version of the DW engine. Does not have to be a dot seperated list of numbers or anything, any string will do. */
dusk.ver = "0.0.10-alpha";

/** Version of the DW engine, this may not be human readable, and can be used to check if a save file is older than a certain version, or something. Later numbers are newer versions. 
 * @type {number} */
dusk.verId = 10;

/** The frame rate, in frames per second. 
 * @type {number} */
dusk.frameRate = ("__frameRate__" in window)?window.__frameRate__:60;

/** The name of the HTML canvas object SimpleGui uses.
 * @type {string} 
 * @see dusk.mods.simpleGui */
dusk.canvas = ("__canvas__" in window)?window.__canvas__:"canvas";

/** @depreciated */
dusk.logElem = ("__logElement__" in window)?window.__logElement__:"dwlog";

/** {boolean} If true, then some features for developers are added, such as no caching for scripts and FPS info.
 */
dusk.dev = ("__development__" in window)?window.__development__:true;

//Replaced in StartGame.js
dusk.startGame = function() {
	setTimeout(dusk.startGame, 100);
}
//DEPRECIATED! DON'T USE OR I'LL KILL YOU!
window.duskWolf = dusk;

window.duskWolf.error = function(text) {
	if(this.logLevel >= 1) window.console.error(text);
	if(this.htmlLogLevel >= 1 && this.logElem) $("#"+this.logElem).append("<div style='color:#990000'>"+text+"</div>");
}
