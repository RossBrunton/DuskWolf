//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FpsMeter", (function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var frameTicker = load.require("dusk.utils.frameTicker");
	
	/** Creates a new FpsMeter component.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * 
	 * @class dusk.sgui.FpsMeter
	 * 
	 * @classdesc A simple label that sets itself to the frame rate every frame.
	 * 
	 * @extends dusk.sgui.Label
	 * @constructor
	 */
	var FpsMeter = function (parent, name) {
		Label.call(this, parent, name);
		
		this._count = 0;
		this._readings = new Uint8Array(30);
		
		//Listeners
		this.frame.listen(_frame.bind(this));
	};
	FpsMeter.prototype = Object.create(Label.prototype);
	
	/** Called every frame, and sets the text to the frame rate.
	 * @param {object} e The event object.
	 * @private
	 */
	var _frame = function(e) {
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
	};
	
	sgui.registerType("FpsMeter", FpsMeter);
	
	return FpsMeter;
})());
