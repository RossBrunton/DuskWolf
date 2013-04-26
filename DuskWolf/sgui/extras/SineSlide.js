//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Effect");
dusk.load.require(">dusk.Range");

dusk.load.provide("dusk.sgui.extras.SineSlide");

/** @class dusk.sgui.extras.SineSlide
 * 
 * @classdesc Moves a component in a sine curve. This means that component will start moving at a high speed, but slowly
 *  slow down it's speed until it stops.
 * 
 * The x or y coordinate is given by the equation `component's original x/y + peak * sin(modifier * time)`.
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Effect
 * @since 0.0.18-alpha
 * @constructor
 */
dusk.sgui.extras.SineSlide = function(owner, name) {
	dusk.sgui.extras.Effect.call(this, owner, name);
	
	/** The maximum height of the transition.
	 * @type integer
	 */
	this.peak = 0;
	/** The direction to move the component; one of the `dusk.sgui.Component#DIR_*` constants.
	 * @type integer
	 * @default dusk.sgui.Component#DIR_UP
	 */
	this.dir = dusk.sgui.c.DIR_UP;
	/** The modifier; n where x or y = sin(nx). Typically between 0.0 and 2.0, higher numbers (>1.0) make the component
	 *  come back down once it has reached the peak, while smaler numers (<1.0) makes the component end prematurley.
	 * @type float
	 * @default 1.0
	 */
	this.modifier = 1.0;
	/** Base x/y that the calculated thing is added to.
	 * @type integer
	 * @private
	 */
	this._base = 0;
	/** The range used internally track time.
	 * @type dusk.Range
	 * @private
	 */
	this._range = null;
	
	//Listeners
	this._tick.listen(this._ssOnTick, this);
	this._onStart.listen(this._ssOnStart, this);
	this._onEnd.listen(this._ssOnEnd, this);
	
	//Prop masks
	this._props.map("peak", "peak");
	this._props.map("dir", "dir");
	this._props.map("modifier", "modifier");
};
dusk.sgui.extras.SineSlide.prototype = Object.create(dusk.sgui.extras.Effect.prototype);

/** Used internally to start the effect.
 * @private
 */
dusk.sgui.extras.SineSlide.prototype._ssOnStart = function() {
	this._range = new dusk.Range(0, Math.PI/2, 0);
	this._range.setUpFraction(1/this.duration);
	
	if(this.dir == dusk.sgui.c.DIR_UP || this.dir == dusk.sgui.c.DIR_DOWN) {
		this._base = this._owner.y;
	}else if(this.dir == dusk.sgui.c.DIR_LEFT || this.dir == dusk.sgui.c.DIR_RIGHT) {
		this._base = this._owner.x;
	}
};

/** Used internally to do a single tick of the effect.
 * @private
 */
dusk.sgui.extras.SineSlide.prototype._ssOnTick = function() {
	this._range.up();
	
	switch(this.dir) {
		case dusk.sgui.c.DIR_UP:
			this._owner.y = ~~(this._base - (this.peak * Math.sin(this.modifier * this._range)));
			break;
		
		case dusk.sgui.c.DIR_DOWN:
			this._owner.y = ~~(this._base + (this.peak * Math.sin(this.modifier * this._range)));
			break;
		
		case dusk.sgui.c.DIR_LEFT:
			this._owner.x = ~~(this._base - (this.peak * Math.sin(this.modifier * this._range)));
			break;
		
		case dusk.sgui.c.DIR_RIGHT:
			this._owner.x = ~~(this._base + (this.peak * Math.sin(this.modifier * this._range)));
			break;
	}
};

/** Used internally once the effect has ended to set the end location correctly.
 * @private
 */
dusk.sgui.extras.SineSlide.prototype._ssOnEnd = function() {
	this._range.value = this._range.max;
	this._tick.fire();
};


Object.seal(dusk.sgui.extras.SineSlide);
Object.seal(dusk.sgui.extras.SineSlide.prototype);

dusk.sgui.registerExtra("SineSlide", dusk.sgui.extras.SineSlide);
