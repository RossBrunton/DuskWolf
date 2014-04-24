//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Label");

dusk.load.provide("dusk.sgui.FpsMeter");

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
dusk.sgui.FpsMeter = function (parent, comName) {
	dusk.sgui.Label.call(this, parent, comName);
	
	//Listeners
	this.frame.listen(this._fpsFrame, this);
};
dusk.sgui.FpsMeter.prototype = Object.create(dusk.sgui.Label.prototype);

/** Called every frame, and sets the text to the frame rate.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.FpsMeter.prototype._fpsFrame = function(e) {
	this.text = ~~(dusk.sgui.frameRate) + "fps";
};

Object.seal(dusk.sgui.FpsMeter);
Object.seal(dusk.sgui.FpsMeter.prototype);

dusk.sgui.registerType("FpsMeter", dusk.sgui.FpsMeter);
