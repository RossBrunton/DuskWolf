//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.RangeText", (function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var Range = load.require("dusk.utils.Range");

	/** @class dusk.sgui.RangeText
	 * 
	 * @classdesc A rangeText is a label that has its content linked to a `{@link dusk.utils.Range}` instance.
	 * 
	 * When the value of the Range changes then the content of this label will change as well.
	 * 
	 * If an orientation is specified, then the range can be changed by using a direction control.
	 * 
	 * @extends dusk.sgui.Label
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @since 0.0.18-alpha
	 * @constructor
	 */
	var RangeText = function (parent, name) {
		Label.call(this, parent, name);
		
		/** Internal storage for the range used in this component.
		 * @type dusk.utils.Range
		 * @private
		 */
		this._range = null;
		/** The range used for this.
		 * @type dusk.utils.Range
		 */
		this.range = null;
		/** The id of the "onchanged" listener for range.
		 * @type integer
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._rangeChangedId = 0;
		
		/** The orientation; this determines whether the horizontal or vertical keys will do the range changing.
		 *  
		 * Must be one of the `ORIENT_*` constants in `{@link dusk.sgui.c}`
		 * @type integer
		 * @default dusk.sgui.DynamicGrid.ORIENT_VER
		 */
		this.orientation = c.ORIENT_VER;
		
		//Defaults
		this.activeBorder = "#990000";
		
		//Prop masks
		this._mapper.map("range", "range");
		this._mapper.map("orientation", "orientation");
		
		//Listeners
		this.dirPress.listen(this._changeValue.bind(this));
	};
	RangeText.prototype = Object.create(Label.prototype);

	//range
	Object.defineProperty(RangeText.prototype, "range", {
		set: function(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			this._range = value;
			if(this._range) {
				this._rangeChangedId = this._range.onChange.listen(this._rangeChanged.bind(this));
				this.text = this._range.value;
			}
		},
		
		get: function() {
			return this._range;
		}
	});

	/** When the range changes, this is called. Sets the text to it's value.
	 * @param {object} e The event object.
	 * @private
	 */
	RangeText.prototype._rangeChanged = function(e) {
		this.text = e.value;
		return e;
	};

	/** An a direction press, this will change the value if needed.
	 * @param {object} e The event object.
	 * @private
	 */
	RangeText.prototype._changeValue = function(e) {
		if(!this.active || !this._range) return true;
		if(this.orientation == c.ORIENT_HOR) {
			if(e.dir == c.DIR_RIGHT) {
				this._range.up();
				return false;
			}
			
			if(e.dir == c.DIR_LEFT) {
				this._range.down();
				return false;
			}
		}else if(this.orientation == c.ORIENT_VER) {
			if(e.dir == c.DIR_UP) {
				this._range.up();
				return false;
			}
			
			if(e.dir == c.DIR_DOWN) {
				this._range.down();
				return false;
			}
		}
		return true;
	};

	Object.seal(RangeText);
	Object.seal(RangeText.prototype);

	sgui.registerType("RangeText", RangeText);
	
	return RangeText;
})());
