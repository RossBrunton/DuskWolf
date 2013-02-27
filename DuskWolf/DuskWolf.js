//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk");

/** @namespace dusk
 * 
 * @description This is the "root" object for DuskWolf, and provides a few functions and configuration thingies.
 * 
 * The DuskWolf engine is created by SavageWolf (Ross Brunton) who can be contacted by email at savagewolf8@gmail.com if you so desire.
 * 
 * You could read readme.md for more information about the engine, but I doubt you'd be able to figure out that you can open it in a text editor.
 * 
 * My naming standard of things are as follows:
 * 
 * - CapitalLetters denotes a class.
 * 
 * - camelCase denotes a public property of an object, namespace or anything that isn't a lass.
 * 
 * - YELLING for constants.
 * 
 * - \_\_doubleUnderscore\_\_ denotes a configuration var, these are all global.
 * 
 * - _singleUnderscore denotes ether a private or protected function.
 */

/** Version of the DW engine. Must contain at least one number, and numbers furthest to the left indicate newer versions.
 * @type string
 */
dusk.ver = "0.0.18-alpha";

/** The frame rate, in frames per second.
 * 
 * If it exists, this is set the value of `window.__frameRate__`.
 * @type integer
 * @default 60
 */
dusk.frameRate = ("__frameRate__" in window)?__frameRate__:60;

/** The path to the data directory, this is where the game will look for all it's data (like images) if given a relative URL.
 * 
 *  If it exists, this is set the value of `window.__dataDir__`.
 * @type string
 * @defualt "Data/"
 */
dusk.dataDir = ("__dataDir__" in window)?__dataDir__:"Data/";

/** The name of the HTML canvas object SimpleGui uses.
 * 
 * If it exists, this is set the value of `window.__canvas__`.
 * @type string
 * @see dusk.sgui
 * @default "canvas"
 */
dusk.canvas = ("__canvas__" in window)?__canvas__:"canvas";

/** If true, then some features for developers are added, such as no caching for scripts and FPS info.
 * 
 * If it exists, this is set the value of `window.__development__`.
 * @type boolean
 * @default true
 */
dusk.dev = ("__development__" in window)?__development__:true;

/** If true, then the game has been started (`{@link dusk.startGame}` has been called).
 * @type boolean
 */
dusk.started = false;

/** An event dispatcher which fires when the game engine is ready to go.
 * 
 * The events fired have no properties.
 * 
 * @type dusk.EventDispatcher
 * @since 0.0.14-alpha
 */
dusk.onLoad = new dusk.EventDispatcher("dusk.onLoad");

/** Call this to start the game, and fire the dusk.onLoad EventDispatcher. */
dusk.startGame = function() {
	dusk.started = true;
	dusk.onLoad.fire();
};
