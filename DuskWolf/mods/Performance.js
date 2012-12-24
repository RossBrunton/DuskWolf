//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.mods.performance");

dusk.mods.performance._framesRan = 0;
dusk.mods.performance._time = (new Date()).getTime();
dusk.mods.performance.frameRate = 0;

dusk.mods.performance._rframesRan = 0;
dusk.mods.performance._rtime = (new Date()).getTime();
dusk.mods.performance.renderFrameRate = 0;

dusk.mods.frameTicker.onFrame.listen(function e_frame(e) {
	dusk.mods.performance._framesRan++;
	if(dusk.mods.performance._framesRan == 1000){
		this.frameRate = Math.round(1000000000/((new Date()).getTime()-this._time))/1000;
		dusk.mods.performance._time = (new Date()).getTime();
		dusk.mods.performance._framesRan = 0;
		if(this.frameRate < dusk.frameRate * 0.75) console.warn("Frame rate is low: "+this.frameRate+"fps.");
	}
}, dusk.mods.performance);

dusk.mods.simpleGui.onRender.listen(function e_onRender(e) {
	dusk.mods.performance._rframesRan++;
	if(dusk.mods.performance._rframesRan == 1000){
		this.renderFrameRate = Math.round(1000000000/((new Date()).getTime()-this._rtime))/1000;
		dusk.mods.performance._rtime = (new Date()).getTime();
		dusk.mods.performance._rframesRan = 0;
		if(this.renderFrameRate < 60) console.warn("Render frame rate is below 60Hz: "+this.renderFrameRate+"fps.");
	}
}, dusk.mods.performance);
