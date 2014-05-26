//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FpsMeter", (function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");

	/** Creates a new FpsMeter component.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * 
	 * @class dusk.sgui.FpsMeter
	 * 
	 * @classdesc A simple label that sets itself to the frame rate every frame.
	 * 
	 * @extends dusk.sgui.Label
	 * @constructor
	 */
	var FpsMeter = function (parent, comName) {
		Label.call(this, parent, comName);
		
		//Listeners
		this.frame.listen(this._fpsFrame.bind(this));
	};
	FpsMeter.prototype = Object.create(Label.prototype);

	/** Called every frame, and sets the text to the frame rate.
	 * @param {object} e The event object.
	 * @private
	 */
	FpsMeter.prototype._fpsFrame = function(e) {
		this.text = ~~(sgui.frameRate) + "fps";
	};

	Object.seal(FpsMeter);
	Object.seal(FpsMeter.prototype);

	sgui.registerType("FpsMeter", FpsMeter);
	
	return FpsMeter;
})());
