//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.DynamicWidth", function() {
	var Range = load.require("dusk.utils.Range");
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	
	/** A dynamic width component changes it's width depending on the value of a range.
	 * 
	 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range is
	 *  to the `max` value.
	 * 
	 * @extends dusk.sgui.extras.Extra
	 * @memberof dusk.sgui.extras
	 */
	class DynamicWidth extends Extra {
		/** Creates a new DynamicWidth extra.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			/** Internal storage for the range used in this component.
			 * @type dusk.utils.Range
			 * @private
			 * @memberof! dusk.sgui.extras.DynamicWidth#
			 */
			this._range = null;
			/** The range used for this.
			 * @type dusk.utils.Range
			 * @memberof! dusk.sgui.extras.DynamicWidth#
			 */
			this.range = null;
			/** The id of the "onchanged" listener for range.
			 * @type integer
			 * @private
			 * @since 0.0.20-alpha
			 * @memberof! dusk.sgui.extras.DynamicWidth#
			 */
			this._rangeChangedId = 0;
			
			/** The minimum width that the component can be.
			 * @type integer
			 * @memberof! dusk.sgui.extras.DynamicWidth#
			 */
			this.min = 0;
			/** The maximum width that the component can be.
			 * @type integer
			 * @memberof! dusk.sgui.extras.DynamicWidth#
			 */
			this.max = 0;
			
			//Prop masks
			this._props.map("range", "range", ["min", "max"]);
			this._props.map("min", "min");
			this._props.map("max", "max");
		}
		
		//range
		set range(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			this._range = value;
			if(this._range) {
				this._rangeChangedId = this._range.onChange.listen(this._rangeChanged.bind(this));
				this._rangeChanged({});
			}
		}
		
		get range() {
			return this._range;
		}
		
		/** Used internally to manage the range value changing.
		 * @param {object} e An event object from `{@link dusk.utils.Range.onChange}`.
		 * @private
		 */
		_rangeChanged(e) {
			this._owner.width = ~~(this.min + ((this.max-this.min) * this.range.getFraction()));
			return e;
		}
	}
	
	sgui.registerExtra("DynamicWidth", DynamicWidth);
	
	return DynamicWidth;
});


load.provide("dusk.sgui.extras.DynamicHeight", function() {
	var Range = load.require("dusk.utils.Range");
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	
	/** A dynamic width component changes it's width depending on the value of a range.
	 * 
	 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range is
	 *  to the `max` value.
	 * 
	 * @extends dusk.sgui.extras.Extra
	 * @memberof dusk.sgui.extras
	 */
	class DynamicHeight extends Extra {
		/** Creates a new DynamicHeight extra.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			/** Internal storage for the range used in this component.
			 * @type dusk.utils.Range
			 * @private
			 * @memberof! dusk.sgui.extras.DynamicHeight#
			 */
			this._range = null;
			/** The range used for this.
			 * @type dusk.utils.Range
			 * @memberof! dusk.sgui.extras.DynamicHeight#
			 */
			this.range = null;
			/** The id of the "onchanged" listener for range.
			 * @type integer
			 * @private
			 * @since 0.0.20-alpha
			 * @memberof! dusk.sgui.extras.DynamicHeight#
			 */
			this._rangeChangedId = 0;
			
			/** The minimum width that the component can be.
			 * @type integer
			 * @memberof! dusk.sgui.extras.DynamicHeight#
			 */
			this.min = 0;
			/** The maximum width that the component can be.
			 * @type integer
			 * @memberof! dusk.sgui.extras.DynamicHeight#
			 */
			this.max = 0;
			
			//Prop masks
			this._props.map("range", "range", ["min", "max"]);
			this._props.map("min", "min");
			this._props.map("max", "max");
		}
		
		//range
		set range(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			this._range = value;
			if(this._range) {
				this._rangeChangedId = this._range.onChange.listen(this._rangeChanged.bind(this));
				this._rangeChanged({});
			}
		}
		
		get range() {
			return this._range;
		}
		
		/** Used internally to manage the range value changing.
		 * @param {object} e An event object from `{@link dusk.utils.Range.onChange}`.
		 * @private
		 */
		_rangeChanged(e) {
			this._owner.height = ~~(this.min + ((this.max-this.min) * this.range.getFraction()));
			return e;
		}
	}
	
	sgui.registerExtra("DynamicHeight", DynamicHeight);
	
	return DynamicHeight;
});
