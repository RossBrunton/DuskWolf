//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.performance");

dusk.load.provide("dusk.sgui.FpsMeter");

/** 
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.FpsMeter
 * 
 * @classdesc 
 * 
 * @extends dusk.sgui.Label
 * @constructor
 */
dusk.sgui.FpsMeter = function (parent, comName) {
	dusk.sgui.Label.call(this, parent, comName);
	
	//Listeners
	this.frame.listen(this._fpsFrame, this);
};
dusk.sgui.FpsMeter.prototype = Object.create(dusk.sgui.Label.prototype);

dusk.sgui.FpsMeter.prototype._fpsFrame = function(e) {
	this.text = (Math.round(dusk.performance.frameRate*1000)/1000) + "fps / " 
	+ (Math.round(dusk.performance.renderFrameRate*1000)/1000) + "Hz";
};

Object.seal(dusk.sgui.FpsMeter);
Object.seal(dusk.sgui.FpsMeter.prototype);

dusk.sgui.registerType("FpsMeter", dusk.sgui.FpsMeter);
