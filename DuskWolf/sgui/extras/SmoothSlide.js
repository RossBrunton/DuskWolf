//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Effect");
dusk.load.require(">dusk.Range");

dusk.load.provide("dusk.sgui.extras.SmoothSlide");

/** @class dusk.sgui.extras.SmoothSlide
 * 
 * @classdesc This simply slides the component in a direction throughout it's duration.
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Effect
 * @since 0.0.18-alpha
 * @constructor
 */
dusk.sgui.extras.SmoothSlide = function(owner, name) {
	dusk.sgui.extras.Effect.call(this, owner, name);
	
	/** By how much to move the component by.
	 * @type integer
	 */
	this.by = 0;
	/** The direction to move the component; one of the `dusk.sgui.Component#DIR_*` constants.
	 * @type integer
	 * @default dusk.sgui.Component#DIR_UP
	 */
	this.dir = dusk.sgui.Component.DIR_UP;
	/** The range used internally to move the component.
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
	this._tick.listen(this._ssOnTick, this);
	this._onStart.listen(this._ssOnStart, this);
	this._onEnd.listen(this._ssOnEnd, this);
	
	//Prop masks
	this._props.map("by", "by");
	this._props.map("dir", "dir");
};
dusk.sgui.extras.SmoothSlide.prototype = Object.create(dusk.sgui.extras.Effect.prototype);

/** Used internally to start the effect.
 * @private
 */
dusk.sgui.extras.SmoothSlide.prototype._ssOnStart = function() {
	switch(this.dir) {
		case dusk.sgui.Component.DIR_UP:
			this._range = new dusk.Range(this._owner.y - this.by, this._owner.y, this._owner.y);
			this._range.setDownFraction(1/this.duration);
			this._decreasing = true;
			break;
		
		case dusk.sgui.Component.DIR_DOWN:
			this._range = new dusk.Range(this._owner.y, this._owner.y + this.by, this._owner.y);
			this._range.setUpFraction(1/this.duration);
			this._decreasing = false;
			break;
		
		case dusk.sgui.Component.DIR_LEFT:
			this._range = new dusk.Range(this._owner.x - this.by, this._owner.x, this._owner.x);
			this._range.setDownFraction(1/this.duration);
			this._decreasing = true;
			break;
		
		case dusk.sgui.Component.DIR_RIGHT:
			this._range = new dusk.Range(this._owner.x, this._owner.x + this.by, this._owner.x);
			this._range.setUpFraction(1/this.duration);
			this._decreasing = false;
			break;
		
		default:
			console.warn("Unrecognised direction "+this.dir+" for SmoothSlide effect.");
	}
};

/** Used internally to do a single tick of the effect.
 * @private
 */
dusk.sgui.extras.SmoothSlide.prototype._ssOnTick = function() {
	if(this._decreasing) {
		this._range.down();
	}else{
		this._range.up();
	}
	
	if(this.dir == dusk.sgui.Component.DIR_UP || this.dir == dusk.sgui.Component.DIR_DOWN) {
		this._owner.y = this._range.value;
	}else if(this.dir == dusk.sgui.Component.DIR_LEFT || this.dir == dusk.sgui.Component.DIR_RIGHT) {
		this._owner.x = this._range.value;
	}
};

/** Used internally once the effect has ended to set the end location correctly.
 * @private
 */
dusk.sgui.extras.SmoothSlide.prototype._ssOnEnd = function() {
	switch(this.dir) {
		case dusk.sgui.Component.DIR_UP:
			this._owner.y = this._range.min;
			break;
		
		case dusk.sgui.Component.DIR_DOWN:
			this._owner.y = this._range.max;
			break;
		
		case dusk.sgui.Component.DIR_LEFT:
			this._owner.x = this._range.min;
			break;
		
		case dusk.sgui.Component.DIR_RIGHT:
			this._owner.x = this._range.max;
			break;
	}
};


Object.seal(dusk.sgui.extras.SmoothSlide);
Object.seal(dusk.sgui.extras.SmoothSlide.prototype);

dusk.sgui.registerExtra("SmoothSlide", dusk.sgui.extras.SmoothSlide);
