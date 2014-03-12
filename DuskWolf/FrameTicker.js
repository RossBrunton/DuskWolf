//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk");

dusk.load.provide("dusk.frameTicker");

/** @namespace dusk.frameTicker
 * @name dusk.frameTicker
 * 
 * @description This module contains things that allow code to be run at a specified frame rate.
 * 
 * @since 0.0.14-alpha
 */

/** An event dispatcher which fires once every frame.
 * 
 * There are `{@link dusk.frameRate}` frames in a second, although it may be less due to the system's performance.
 * 
 * The events fired have no properties.
 * 
 * @type dusk.EventDispatcher
 */
dusk.frameTicker.onFrame = new dusk.EventDispatcher();

setInterval(dusk.frameTicker.onFrame.fire.bind(dusk.frameTicker.onFrame), 1000/dusk.frameRate);

Object.seal(dusk.frameTicker);
