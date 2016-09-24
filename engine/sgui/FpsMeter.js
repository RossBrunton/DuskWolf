//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FpsMeter", function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var frameTicker = load.require("dusk.utils.frameTicker");
	
	/** A simple label that sets itself to the frame rate every frame.
	 * 
	 * @extends dusk.text.sgui.Label
	 * @memberof dusk.sgui
	 */
	class FpsMeter extends Label {
		/** Creates a new FpsMeter.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			this._count = 0;
			this._readings = new Uint8Array(30);
			
			//Listeners
			this.frame.listen(this._frame.bind(this));
		}
		
		/** Called every frame, and sets the text to the frame rate.
		 * @param {object} e The event object.
		 * @private
		 */
		_frame(e) {
			this._readings[this._count] = ~~(frameTicker.trueFrameRate);
			this._count ++;
			
			if(this._count == 30) {
				var fps = (
					this._readings[0]
					+ this._readings[5]
					+ this._readings[10]
					+ this._readings[15]
					+ this._readings[20]
					+ this._readings[25]
					+ this._readings[29]
					+ this._readings[18]
				) >> 3;
				
				this.text =  fps + "fps";
				this._count = 0;
			}
		}
	}
	
	sgui.registerType("FpsMeter", FpsMeter);
	
	return FpsMeter;
});
