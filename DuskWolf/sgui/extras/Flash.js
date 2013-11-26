//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Effect");
dusk.load.require(">dusk.Range");

dusk.load.provide("dusk.sgui.extras.Flash");

/** @class dusk.sgui.extras.Flash
 * 
 * @classdesc 
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Effect
 * @since 0.0.18-alpha
 * @constructor
 */
dusk.sgui.extras.Flash = function(owner, name) {
	dusk.sgui.extras.Effect.call(this, owner, name);
	
	/** The maximum alpha value.
	 * @type float
	 * @default 1.0
	 */
	this.max = 1.0;
	/** The minimum alpha value.
	 * @type float
	 * @default 0.0
	 */
	this.min = 0.0;
	/** The number of frames it takes to flash between the maximum and minimum. Higher numbers slow the animation down.
	 * @type integer
	 * @default 16
	 */
	this.speed = 16;
	/** The range used internally to switch between the two values.
	 * @type dusk.Range
	 * @private
	 */
	this._range = null;
	/** Whether the value of the range is going up or down.
	 * @type boolean
	 * @private
	 */
	this._decreasing = false;
	
	//Listeners
	this._tick.listen(this._flsOnTick, this);
	this._onStart.listen(this._flsOnStart, this);
	this._onEnd.listen(this._flsOnEnd, this);
	
	//Prop masks
	this._props.map("min", "min");
	this._props.map("max", "max");
	this._props.map("speed", "speed");
};
dusk.sgui.extras.Flash.prototype = Object.create(dusk.sgui.extras.Effect.prototype);

/** Used internally to start the effect.
 * @private
 */
dusk.sgui.extras.Flash.prototype._flsOnStart = function(e) {
	this._range = new dusk.Range(this.min, this.max, this.max);
	this._range.setDownFraction(1/this.speed);
	this._range.setUpFraction(1/this.speed);
	
	this._decreasing = true;
};

/** Used internally to do a single tick of the effect.
 * @private
 */
dusk.sgui.extras.Flash.prototype._flsOnTick = function(e) {
	if(this._decreasing) {
		this._range.down();
		if(this._range < this.min + 0.01) this._decreasing = false;
	}else{
		this._range.up();
		if(this._range > this.max - 0.01) this._decreasing = true;
	}
	
	this._owner.alpha = this._range.value;
};

/** Used internally once the effect has ended to set the end alpha correctly.
 * @private
 */
dusk.sgui.extras.Flash.prototype._flsOnEnd = function(e) {
	this._owner.alpha = this.max;
};


Object.seal(dusk.sgui.extras.Flash);
Object.seal(dusk.sgui.extras.Flash.prototype);

dusk.sgui.registerExtra("Flash", dusk.sgui.extras.Flash);
