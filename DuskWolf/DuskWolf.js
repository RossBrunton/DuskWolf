//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk");

/** @namespace dusk
 * 
 * @description <p>This is the "root" object for DuskWolf, and provides a few functions and configuration thingies.</p>
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

/** Version of the DW engine. Does not have to be a dot seperated list of numbers or anything, any string will do. 
 * @type number */
dusk.ver = "0.0.11-alpha";

/** Version of the DW engine, this may not be human readable, and can be used to check if a save file is older than a certain version, or something. Later numbers are newer versions. 
 * @type number */
dusk.verId = 11;

/** The frame rate, in frames per second. 
 * @type number */
dusk.frameRate = ("__frameRate__" in window)?window.__frameRate__:60;

/** The name of the HTML canvas object SimpleGui uses.
 * @type string
 * @see dusk.mods.simpleGui */
dusk.canvas = ("__canvas__" in window)?window.__canvas__:"canvas";

/** If true, then some features for developers are added, such as no caching for scripts and FPS info.
 * @type boolean */
dusk.dev = ("__development__" in window)?window.__development__:true;

//Replaced in StartGame.js
dusk.startGame = function() {
	setTimeout(dusk.startGame, 100);
}
