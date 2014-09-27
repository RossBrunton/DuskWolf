//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.SineSlide", (function() {
	var Effect = load.require("dusk.sgui.extras.Effect");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var Range = load.require("dusk.utils.Range");

	/** @class dusk.sgui.extras.SineSlide
	 * 
	 * @classdesc Moves a component in a sine curve. This means that component will start moving at a high speed, but
	 *  slowly slow down it's speed until it stops.
	 * 
	 * The x or y coordinate is given by the equation `component's original x/y + peak * sin(modifier * time)`.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Effect
	 * @since 0.0.18-alpha
	 * @constructor
	 */
	var SineSlide = function(owner, name) {
		Effect.call(this, owner, name);
		
		/** The maximum height of the transition.
		 * @type integer
		 */
		this.peak = 0;
		/** The direction to move the component; one of the `dusk.sgui.Component#DIR_*` constants.
		 * @type integer
		 * @default dusk.sgui.Component#DIR_UP
		 */
		this.dir = c.DIR_UP;
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
		 * @type dusk.utils.Range
		 * @private
		 */
		this._range = null;
		
		//Listeners
		this._tick.listen(this._ssOnTick.bind(this));
		this._onStart.listen(this._ssOnStart.bind(this));
		this._onEnd.listen(this._ssOnEnd.bind(this));
		
		//Prop masks
		this._props.map("peak", "peak");
		this._props.map("dir", "dir");
		this._props.map("modifier", "modifier");
	};
	SineSlide.prototype = Object.create(Effect.prototype);

	/** Used internally to start the effect.
	 * @private
	 */
	SineSlide.prototype._ssOnStart = function(e) {
		this._range = new Range(0, Math.PI/2, 0);
		this._range.setUpFraction(1/this.duration);
		
		if(this.dir == c.DIR_UP || this.dir == c.DIR_DOWN) {
			this._base = this._owner.y;
		}else if(this.dir == c.DIR_LEFT || this.dir == c.DIR_RIGHT) {
			this._base = this._owner.x;
		}
	};

	/** Used internally to do a single tick of the effect.
	 * @private
	 */
	SineSlide.prototype._ssOnTick = function(e) {
		this._range.up();
		
		switch(this.dir) {
			case c.DIR_UP:
				this._owner.y = ~~(this._base - (this.peak * Math.sin(this.modifier * this._range)));
				break;
			
			case c.DIR_DOWN:
				this._owner.y = ~~(this._base + (this.peak * Math.sin(this.modifier * this._range)));
				break;
			
			case c.DIR_LEFT:
				this._owner.x = ~~(this._base - (this.peak * Math.sin(this.modifier * this._range)));
				break;
			
			case c.DIR_RIGHT:
				this._owner.x = ~~(this._base + (this.peak * Math.sin(this.modifier * this._range)));
				break;
		}
	};

	/** Used internally once the effect has ended to set the end location correctly.
	 * @private
	 */
	SineSlide.prototype._ssOnEnd = function(e) {
		this._range.value = this._range.max;
		this._tick.fire();
	};

	Object.seal(SineSlide);
	Object.seal(SineSlide.prototype);

	sgui.registerExtra("SineSlide", SineSlide);
	
	return SineSlide;
})());
