//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.Flash", function() {
	var Range = load.require("dusk.utils.Range");
	var Effect = load.require("dusk.sgui.extras.Effect");
	var sgui = load.require("dusk.sgui");
	
	/** 
	 * @extends dusk.sgui.extras.Effect
	 * @since 0.0.18-alpha
	 * @memberof dusk.sgui.extras
	 */
	class Flash extends Effect {
		/** Creates a new Flash Effect.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			/** The maximum alpha value.
			 * @type float
			 * @default 1.0
			 * @memberof! dusk.sgui.extras.Flash#
			 */
			this.max = 1.0;
			/** The minimum alpha value.
			 * @type float
			 * @default 0.0
			 * @memberof! dusk.sgui.extras.Flash#
			 */
			this.min = 0.0;
			/** The number of frames it takes to flash between the maximum and minimum. Higher numbers slow the animation
			 *  down.
			 * @type integer
			 * @default 16
			 * @memberof! dusk.sgui.extras.Flash#
			 */
			this.speed = 16;
			/** The range used internally to switch between the two values.
			 * @type dusk.utils.Range
			 * @private
			 * @memberof! dusk.sgui.extras.Flash#
			 */
			this._range = null;
			/** Whether the value of the range is going up or down.
			 * @type boolean
			 * @private
			 * @memberof! dusk.sgui.extras.Flash#
			 */
			this._decreasing = false;
			
			//Listeners
			this._tick.listen(this._flsOnTick.bind(this));
			this._onStart.listen(this._flsOnStart.bind(this));
			this._onEnd.listen(this._flsOnEnd.bind(this));
			
			//Prop masks
			this._props.map("min", "min");
			this._props.map("max", "max");
			this._props.map("speed", "speed");
		}
		
		/** Used internally to start the effect.
		 * @private
		 */
		_flsOnStart(e) {
			this._range = new Range(this.min, this.max, this.max);
			this._range.setDownFraction(1/this.speed);
			this._range.setUpFraction(1/this.speed);
			
			this._decreasing = true;
		}
		
		/** Used internally to do a single tick of the effect.
		 * @private
		 */
		_flsOnTick(e) {
			if(this._decreasing) {
				this._range.down();
				if(this._range < this.min + 0.01) this._decreasing = false;
			}else{
				this._range.up();
				if(this._range > this.max - 0.01) this._decreasing = true;
			}
			
			this._owner.alpha = this._range.value;
		}
		
		/** Used internally once the effect has ended to set the end alpha correctly.
		 * @private
		 */
		_flsOnEnd(e) {
			this._owner.alpha = this.max;
		}
	}
	
	sgui.registerExtra("Flash", Flash);
	
	return Flash;
});
