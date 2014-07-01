//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.Range", (function() {
	var EventDispatcher = load.require("dusk.EventDispatcher");
	/** Creates a new Range
	 * 
	 * @class dusk.Range
	 * 
	 * @classdesc A range is a data type that stores a value between a maximum and a minimum.
	 *  This class will automatically ensure that the specified value is in the range.
	 * 
	 * The value can be increased by specified intervals using the `up` and `down` functions.
	 * 
	 * @param {integer|float=0} min The minimum value that this range accepts.
	 * @param {integer|float=100} max The maximum value that this range accepts.
	 * @param {integer|float=50} value The initial value of this range.
	 * @param {integer|float=1} up The value that this value will increase by when increased.
	 * @param {integer|float=1} down The value that the value will decrease by when decreased.
	 * @constructor
	 * @since 0.0.18-alpha
	 */
	var Range = function(min, max, value, up, down) {
		/** An event dispatcher that is fired when the value in this range changes.
		 *  The event object has a single property "`value`" which is the value that was set.
		 *  This can be changed, and will alter the value of the range.
		 * @type dusk.EventDispatcher
		 */
		this.onChange = new EventDispatcher("dusk.Range.onChange", EventDispatcher.MODE_PASS);
		/** Internal property for the current value.
		 * @type integer|float
		 * @private
		 */
		this._value = 0;
		/** The current value of this range, this will be between `{@link dusk.Range#min}` and `{@link dusk.Range#max}`.
		 * @type integer|float
		 */
		this.value = value!==undefined?value:50;
		/** The maximum value that this range can store.
		 * @type integer|float
		 */
		this.max = max!==undefined?max:100;
		/** The minimum value that this range can store.
		 * @type integer|float
		 */
		this.min = min!==undefined?min:0;
		/** The amount used to increase the value by one "unit".
		 * @type integer|float
		 */
		this.stepUp = up!==undefined?up:1;
		/** The amount used to decrease the value by one "unit".
		 *   This should be positive if you want the value to decrease.
		 * @type integer|float
		 */
		this.stepDown = down!==undefined?down:1;
	};

	//value
	Object.defineProperty(Range.prototype, "value", {
		get: function() {
			return this._value;
		},
		
		set: function(value) {
			if(value < this.min) value = this.min;
			if(value > this.max) value = this.max;
			if(this._value == value) return;
			this._value = value;
			this._value = this.onChange.fire({"value":this._value}, value).value;
		}
	});

	/** Increases the value by `{@link dusk.Range#stepUp}`.
	 * @return {boolean} Whether the value changed.
	 */
	Range.prototype.up = function() {
		var old = this.value;
		this.value += this.stepUp;
		return old != this.value;
	};

	/** Decreases the value by `{@link dusk.Range#stepDown}`. 
	 * @return {boolean} Whether the value changed.
	 */
	Range.prototype.down = function() {
		var old = this.value;
		this.value -= this.stepDown;
		return old != this.value;
	};

	/** Sets the amount that `{@link dusk.Range#up}` will change to a fraction of the possible range.
	 * @param {float} fract The fraction to set it to.
	 */
	Range.prototype.setUpFraction = function(fract) {
		this.stepUp = (this.max - this.min) * fract;
	};

	/** Sets the amount that `{@link dusk.Range#down}` will change to a fraction of the possible range.
	 * @param {float} fract The fraction to set it to.
	 */
	Range.prototype.setDownFraction = function(fract) {
		this.stepDown = (this.max - this.min) * fract;
	};

	/** Returns the fraction that the current value is between the two ranges.
	 * 
	 * A float between 0.0 and 1.0, higher numbers are closer to the max value.
	 * @return {float} The fraction that the current value is.
	 */
	Range.prototype.getFraction = function() {
		return (this.value-this.min) / (this.max-this.min);
	};

	/** Returns a string representation of this range.
	 * @return {string} A representation of this range.
	 */
	Range.prototype.toString = function() {
		return "[Range "+this.min+" > "+this.value+" > "+this.max+"]";
	};

	/** Returns the current value of this range.
	 * @return {integer|float} The current value.
	 */
	Range.prototype.valueOf = function() {
		return this.value;
	};

	Object.seal(Range);
	Object.seal(Range.prototype);
	
	return Range;
})());
