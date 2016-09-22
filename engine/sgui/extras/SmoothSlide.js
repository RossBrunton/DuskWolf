//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.SmoothSlide", function() {
	var Effect = load.require("dusk.sgui.extras.Effect");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** This simply slides the component in a direction throughout it's duration.
	 * 
	 * @extends dusk.sgui.extras.Effect
	 * @since 0.0.18-alpha
	 * @memberof dusk.sgui.extras
	 */
	class SmoothSlide extends Effect {
		/** Creates a new SmoothSlide extra.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			/** By how much to move the component by.
			 * @type integer
			 * @memberof! dusk.sgui.extras.SmoothSlide#
			 */
			this.by = 0;
			/** The direction to move the component; one of the `dusk.sgui.Component#DIR_*` constants.
			 * @type integer
			 * @default dusk.sgui.Component#DIR_UP
			 * @memberof! dusk.sgui.extras.SmoothSlide#
			 */
			this.dir = c.DIR_UP;
			/** The range used internally to move the component.
			 * @type dusk.utils.Range
			 * @memberof! dusk.sgui.extras.SmoothSlide#
			 * @private
			 */
			this._range = null;
			/** Whether the value of the range is going up or down.
			 * @type boolean
			 * @memberof! dusk.sgui.extras.SmoothSlide#
			 * @private
			 */
			this._decreasing = false;
			
			//Listeners
			this._tick.listen(this._ssOnTick.bind(this));
			this._onStart.listen(this._ssOnStart.bind(this));
			this._onEnd.listen(this._ssOnEnd.bind(this));
			
			//Prop masks
			this._props.map("by", "by");
			this._props.map("dir", "dir");
		}
		
		/** Used internally to start the effect.
		 * @private
		 */
		_ssOnStart(e) {
			switch(this.dir) {
				case c.DIR_UP:
					this._range = new Range(this._owner.y - this.by, this._owner.y, this._owner.y);
					this._range.setDownFraction(1/this.duration);
					this._decreasing = true;
					break;
				
				case c.DIR_DOWN:
					this._range = new Range(this._owner.y, this._owner.y + this.by, this._owner.y);
					this._range.setUpFraction(1/this.duration);
					this._decreasing = false;
					break;
				
				case c.DIR_LEFT:
					this._range = new Range(this._owner.x - this.by, this._owner.x, this._owner.x);
					this._range.setDownFraction(1/this.duration);
					this._decreasing = true;
					break;
				
				case c.DIR_RIGHT:
					this._range = new Range(this._owner.x, this._owner.x + this.by, this._owner.x);
					this._range.setUpFraction(1/this.duration);
					this._decreasing = false;
					break;
				
				default:
					console.warn("Unrecognised direction "+this.dir+" for SmoothSlide effect.");
			}
		}
		
		/** Used internally to do a single tick of the effect.
		 * @private
		 */
		_ssOnTick(e) {
			if(this._decreasing) {
				this._range.down();
			}else{
				this._range.up();
			}
			
			if(this.dir == c.DIR_UP || this.dir == c.DIR_DOWN) {
				this._owner.y = this._range.value;
			}else if(this.dir == c.DIR_LEFT || this.dir == c.DIR_RIGHT) {
				this._owner.x = this._range.value;
			}
		}
		
		/** Used internally once the effect has ended to set the end location correctly.
		 * @private
		 */
		_ssOnEnd(e) {
			switch(this.dir) {
				case c.DIR_UP:
					this._owner.y = this._range.min;
					break;
				
				case c.DIR_DOWN:
					this._owner.y = this._range.max;
					break;
				
				case c.DIR_LEFT:
					this._owner.x = this._range.min;
					break;
				
				case c.DIR_RIGHT:
					this._owner.x = this._range.max;
					break;
			}
		}
	}
	
	sgui.registerExtra("SmoothSlide", SmoothSlide);
	
	return SmoothSlide;
});
