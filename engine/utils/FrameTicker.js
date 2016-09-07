//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.frameTicker", function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var options = load.require("dusk.options");
	
	/** This module contains things that allow code to be run at a specified frame rate.
	 * 
	 * There is an option "frames.frequency" that allows the user to specify they refresh rate of their monitor, and
	 * by default this is autodetected.
	 * 
	 * @since 0.0.14-alpha
	 * @namespace
	 * @memberof dusk.utils
	 */
	var frameTicker = {};
	
	/** The time that the last event ran at.
	 * @type integer
	 * @since 0.0.21-alpha
	 * @private
	 */
	var _lastTick = 0;
	
	/** The current frame rate exactly. Maybe some strange value for the first few frames.
	 * @type float
	 * @since 0.0.21-alpha
	 */
	frameTicker.trueFrameRate = 0;
	
	/** The total number of frames that have elapsed.
	 * @type integer
	 * @since 0.0.21-alpha
	 */
	frameTicker.totalFrames = 0;
	
	/** The current frame rate as described by the respective option. Will be an integer for 30, 60, or 120 fps.
	 * @type integer
	 * @since 0.0.21-alpha
	 */
	Object.defineProperty(frameTicker, "frameRate", {"get":function() {
		var rate = options.get("frames.frequency");
		
		if(rate == "detect") {
			if(frameTicker.trueFrameRate < 45) return 30;
			if(frameTicker.trueFrameRate > 90) return 120;
			return 60;
		}
		
		if(rate == "30Hz") return 30;
		if(rate == "60Hz") return 60;
		if(rate == "120Hz") return 120;
	}});
	
	/** An event dispatcher which fires once every frame.
	 * 
	 * This system attempts to fire 60 frames in a second, although it may be less due to the system's performance or
	 * more due to wierd refresh rates.
	 * 
	 * If the system's refresh rate is 30 fps, it will be fired twice, if it is 60 fps it will be fired once, and if it
	 * is 120, it will be fired every other frame.
	 * 
	 * The events fired have no properties.
	 * 
	 * @type dusk.utils.EventDispatcher
	 */
	frameTicker.onFrame = new EventDispatcher("dusk.utils.frameTicker.onFrame");
	
	var _do = function(time) {
		requestAnimationFrame(_do);
		
		frameTicker.trueFrameRate = 1000 / (time - _lastTick);
		_lastTick = time;
		frameTicker.totalFrames ++;
		
		var rate = frameTicker.frameRate;
		if(rate == 120 && frameTicker.totalFrames % 2 == 0) return;
		frameTicker.onFrame.fire();
		if(rate == 30) frameTicker.onFrame.fire();
		return;
	};
	requestAnimationFrame(_do);
	
	options.register("frames.frequency", options.select, "detect",
		"The refresh rate of the monitor, as seen by your browser (may be lower than your actual refresh rate).",
		["30Hz", "60Hz", "120Hz", "detect"]
	);
	
	return frameTicker;
});
