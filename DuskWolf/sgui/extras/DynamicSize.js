//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.DynamicWidth", (function() {
	var Range = load.require("dusk.Range");
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	
	/** @class dusk.sgui.extras.DynamicWidth
	 * 
	 * @classdesc A dynamic width component changes it's width depending on the value of a range.
	 * 
	 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range is
	 *  to the `max` value.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Extra
	 * @constructor
	 */
	var DynamicWidth = function(owner, name) {
		Extra.call(this, owner, name);
		
		/** Internal storage for the range used in this component.
		 * @type dusk.Range
		 * @private
		 */
		this._range = null;
		/** The range used for this.
		 * @type dusk.Range
		 */
		this.range = null;
		/** The id of the "onchanged" listener for range.
		 * @type integer
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._rangeChangedId = 0;
		
		/** The minimum width that the component can be.
		 * @type integer
		 */
		this.min = 0;
		/** The maximum width that the component can be.
		 * @type integer
		 */
		this.max = 0;
		
		//Prop masks
		this._props.map("range", "range", ["min", "max"]);
		this._props.map("min", "min");
		this._props.map("max", "max");
	};
	DynamicWidth.prototype = Object.create(Extra.prototype);

	//range
	Object.defineProperty(DynamicWidth.prototype, "range", {
		set: function(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			this._range = value;
			if(this._range) {
				this._rangeChangedId = this._range.onChange.listen(this._rangeChanged.bind(this));
				this._rangeChanged({});
			}
		},
		
		get: function() {
			return this._range;
		}
	});

	/** Used internally to manage the range value changing.
	 * @param {object} e An event object from `{@link dusk.Range.onChange}`.
	 * @private
	 */
	DynamicWidth.prototype._rangeChanged = function(e) {
		this._owner.width = ~~(this.min + ((this.max-this.min) * this.range.getFraction()));
		return e;
	};

	Object.seal(DynamicWidth);
	Object.seal(DynamicWidth.prototype);
	
	sgui.registerExtra("DynamicWidth", DynamicWidth);
	
	return DynamicWidth;
})());


load.provide("dusk.sgui.extras.DynamicHeight", (function() {
	var Range = load.require("dusk.Range");
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	
	/** @class dusk.sgui.extras.DynamicHeight
	 * 
	 * @classdesc A dynamic width component changes it's width depending on the value of a range.
	 * 
	 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range is
	 *  to the `max` value.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Extra
	 * @constructor
	 */
	var DynamicHeight = function(owner, name) {
		Extra.call(this, owner, name);
		
		/** Internal storage for the range used in this component.
		 * @type dusk.Range
		 * @private
		 */
		this._range = null;
		/** The range used for this.
		 * @type dusk.Range
		 */
		this.range = null;
		/** The id of the "onchanged" listener for range.
		 * @type integer
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._rangeChangedId = 0;
		
		/** The minimum width that the component can be.
		 * @type integer
		 */
		this.min = 0;
		/** The maximum width that the component can be.
		 * @type integer
		 */
		this.max = 0;
		
		//Prop masks
		this._props.map("range", "range", ["min", "max"]);
		this._props.map("min", "min");
		this._props.map("max", "max");
	};
	DynamicHeight.prototype = Object.create(Extra.prototype);

	//range
	Object.defineProperty(DynamicHeight.prototype, "range", {
		set: function(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			this._range = value;
			if(this._range) {
				this._rangeChangedId = this._range.onChange.listen(this._rangeChanged.bind(this));
				this._rangeChanged({});
			}
		},
		
		get: function() {
			return this._range;
		}
	});

	/** Used internally to manage the range value changing.
	 * @param {object} e An event object from `{@link dusk.Range.onChange}`.
	 * @private
	 */
	DynamicHeight.prototype._rangeChanged = function(e) {
		this._owner.height = ~~(this.min + ((this.max-this.min) * this.range.getFraction()));
		return e;
	};

	Object.seal(DynamicHeight);
	Object.seal(DynamicHeight.prototype);

	sgui.registerExtra("DynamicHeight", DynamicHeight);
	
	return DynamicHeight;
})());
