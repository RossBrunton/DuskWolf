//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.frameTicker");
dusk.load.require("dusk.simpleGui");
dusk.load.require("dusk");

dusk.load.provide("dusk.performance");

/** @namespace dusk.performance
 * @name dusk.performance
 * 
 * @description This contains functions that allow monitoring of frame rate.
 * 
 * When imported, it attaches listeners to the `{@link dusk.frameTicker.onFrame}` and `{@link dusk.simpleGui.onRender}` events, and monitors to check that they are running fast enough.
 * 
 * @since 0.0.14-alpha
 */
 
/** The number of frames ran before the frame rate is checked.
 * @type number
 * @private
 */
dusk.performance._framesRan = 0;
/** The time since the last frame was checked.
 * @type number
 * @private
 */
dusk.performance._time = (new Date()).getTime();
/** The number of render frames ran before the frame rate is checked.
 * @type number
 * @private
 */
dusk.performance._rframesRan = 0;
/** The time since the last render frame was checked.
 * @type number
 * @private
 */
dusk.performance._rtime = (new Date()).getTime();

/** The current frame rate of the game.
 * 
 * This will be 0 until the frame rate is checked for the first time, otherwise it will be the result of the last check.
 * 
 * @type number
 */
dusk.performance.frameRate = 0;

/** The current render frame rate (for drawing) of the game.
 * 
 * This will be 0 until the frame rate is checked for the first time, otherwise it will be the result of the last check.
 * 
 * @type number
 */
dusk.performance.renderFrameRate = 0;

//Frame
dusk.frameTicker.onFrame.listen(function e_frame(e) {
	dusk.performance._framesRan++;
	if(dusk.performance._framesRan == 1000){
		this.frameRate = Math.round(1000000000/((new Date()).getTime()-this._time))/1000;
		dusk.performance._time = (new Date()).getTime();
		dusk.performance._framesRan = 0;
		if(this.frameRate < dusk.frameRate * 0.75) console.warn("Frame rate is low: "+this.frameRate+"fps.");
	}
}, dusk.performance);

//Render
dusk.simpleGui.onRender.listen(function e_onRender(e) {
	dusk.performance._rframesRan++;
	if(dusk.performance._rframesRan == 1000){
		this.renderFrameRate = Math.round(1000000000/((new Date()).getTime()-this._rtime))/1000;
		dusk.performance._rtime = (new Date()).getTime();
		dusk.performance._rframesRan = 0;
		if(this.renderFrameRate < 40) console.warn("Render frame rate is below 40Hz: "+this.renderFrameRate+"fps.");
	}
}, dusk.performance);
