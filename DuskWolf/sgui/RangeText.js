//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Label");
dusk.load.require(">dusk.Range");

dusk.load.provide("dusk.sgui.RangeText");

/** @class dusk.sgui.RangeText
 * 
 * @classdesc A rangeText is a type of text component that has it's content linked to a `{@link dusk.Range}` instance.
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
dusk.sgui.RangeText = function (parent, comName) {
	dusk.sgui.Label.call(this, parent, comName);
	
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
	
	/** The orientation; this determines whether the horizontal or vertical keys will do the range changing.
	 *  
	 * Must be one of the `ORIENT_*` constants in this class.
	 * @type integer
	 * @default dusk.sgui.DynamicGrid.ORIENT_VER
	 */
	this.orientation = dusk.sgui.RangeText.ORIENT_VER;
	
	//Defaults
	this.activeBorder = "#990000";
	
	//Prop masks
	this._registerPropMask("range", "range");
	this._registerPropMask("orientation", "orientation");
	this.dirPress.listen(this._changeValue, this);
};
dusk.sgui.RangeText.prototype = Object.create(dusk.sgui.Label.prototype);

dusk.sgui.RangeText.ORIENT_HOR = 0x01;

dusk.sgui.RangeText.ORIENT_VER = 0x02;

//range
Object.defineProperty(dusk.sgui.RangeText.prototype, "range", {
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
dusk.sgui.RangeText.prototype._rangeChanged = function(e) {
	this.text = e.value;
	return e;
};

/** An a direction press, this will change the value if needed.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.RangeText.prototype._changeValue = function(e) {
	if(!this.active || !this._range) return true;
	if(this.orientation == dusk.sgui.RangeText.ORIENT_HOR) {
		if(e.dir == dusk.sgui.c.DIR_RIGHT) {
			this._range.up();
			return false;
		}
		
		if(e.dir == dusk.sgui.c.DIR_LEFT) {
			this._range.down();
			return false;
		}
	}else if(this.orientation == dusk.sgui.RangeText.ORIENT_VER) {
		if(e.dir == dusk.sgui.c.DIR_UP) {
			this._range.up();
			return false;
		}
		
		if(e.dir == dusk.sgui.c.DIR_DOWN) {
			this._range.down();
			return false;
		}
	}
	return true;
};

Object.seal(dusk.sgui.RangeText);
Object.seal(dusk.sgui.RangeText.prototype);

dusk.sgui.registerType("RangeText", dusk.sgui.RangeText);
