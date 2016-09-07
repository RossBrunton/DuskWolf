//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.Range", function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** A range is a data type that stores a value between a maximum and a minimum.
	 * 
	 * This class will automatically ensure that the specified value is in the range.
	 * 
	 * The value can be increased by specified intervals using the `up` and `down` functions.
	 * 
	 * @constructor
	 * @memberof dusk.utils
	 * @since 0.0.18-alpha
	 */
	class Range {
		/** Creates a new range instance
		 *
		 * @param {integer|float=} min The minimum value that this range accepts, default 0.
		 * @param {integer|float=} max The maximum value that this range accepts, default 100.
		 * @param {integer|float=} value The initial value of this range, default 50.
		 * @param {integer|float=} up The value that this value will increase by when increased, default 1.
		 * @param {integer|float=} down The value that the value will decrease by when decreased, default 1.
		 */
		constructor(min=0, max=100, value=50, up=1, down=1) {
			/** An event dispatcher that is fired when the value in this range changes.
			 *  The event object has a single property "`value`" which is the value that was set.
			 *  This can be changed, and will alter the value of the range.
			 * @memberof dusk.utils.Range#
			 */
			this.onChange = new EventDispatcher("dusk.utils.Range.onChange");
			/** Internal property for the current value.
			 * @type integer|float
			 * @memberof! dusk.utils.Range#
			 * @private
			 */
			this._value = 0;
			/** The current value of this range, this will be between `{@link dusk.utils.Range#min}` and
			 *  `{@link dusk.utils.Range#max}`.
			 * @memberof! dusk.utils.Range#
			 * @type integer|float
			 */
			this.value = value!==undefined?value:50;
			/** The maximum value that this range can store.
			 * @memberof! dusk.utils.Range#
			 * @type integer|float
			 */
			this.max = max!==undefined?max:100;
			/** The minimum value that this range can store.
			 * @memberof! dusk.utils.Range#
			 * @type integer|float
			 */
			this.min = min!==undefined?min:0;
			/** The amount used to increase the value by one "unit".
			 * @memberof! dusk.utils.Range#
			 * @type integer|float
			 */
			this.stepUp = up!==undefined?up:1;
			/** The amount used to decrease the value by one "unit".
			 *   This should be positive if you want the value to decrease.
			 * @memberof! dusk.utils.Range#
			 * @type integer|float
			 */
			this.stepDown = down!==undefined?down:1;
		}
	
		//value
		get value() {
			return this._value;
		}
			
		
		set value(value) {
			if(value < this.min) value = this.min;
			if(value > this.max) value = this.max;
			if(this._value == value) return;
			this._value = value;
			this._value = this.onChange.firePass({"value":this._value}, value).value;
		}
		
		/** Increases the value by `{@link dusk.utils.Range#stepUp}`.
		 * @return {boolean} Whether the value changed.
		 */
		up() {
			var old = this.value;
			this.value += this.stepUp;
			return old != this.value;
		}
		
		/** Decreases the value by `{@link dusk.utils.Range#stepDown}`. 
		 * @return {boolean} Whether the value changed.
		 */
		down() {
			var old = this.value;
			this.value -= this.stepDown;
			return old != this.value;
		}
		
		/** Sets the amount that `{@link dusk.utils.Range#up}` will change to a fraction of the possible range.
		 * @param {float} fract The fraction to set it to.
		 */
		setUpFraction(fract) {
			this.stepUp = (this.max - this.min) * fract;
		}
		
		/** Sets the amount that `{@link dusk.utils.Range#down}` will change to a fraction of the possible range.
		 * @param {float} fract The fraction to set it to.
		 */
		setDownFraction(fract) {
			this.stepDown = (this.max - this.min) * fract;
		}
		
		/** Returns the fraction that the current value is between the two ranges.
		 * 
		 * A float between 0.0 and 1.0, higher numbers are closer to the max value.
		 * @return {float} The fraction that the current value is.
		 */
		getFraction() {
			return (this.value-this.min) / (this.max-this.min);
		}
		
		/** Returns a string representation of this range.
		 * @return {string} A representation of this range.
		 */
		toString() {
			return "[Range "+this.min+" > "+this.value+" > "+this.max+"]";
		}
		
		/** Returns the current value of this range.
		 * @return {integer|float} The current value.
		 */
		valueOf() {
			return this.value;
		}
	};
	
	return Range;
});
