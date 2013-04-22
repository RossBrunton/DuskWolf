//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Grid");
dusk.load.require(">dusk.Range");

dusk.load.provide("dusk.sgui.DynamicGrid");

/** @class dusk.sgui.DynamicGrid
 * 
 * @classdesc A dynamic grid is a grid whose rows or columns are tied to a range of values, and will autoupdate itself.
 * 
 * It is essentially a grid that an instance of `{@link dusk.Range}` can be attached to.
 *  When the value of the range changes, the grid repopulates itself such that the number of rows/columns (depending 
 *   on orientation) matches the range's value.
 * 
 * The value that is different from the orientation (rows if vertical, or cols if horizontal) is used as normal, though
 *  as a convienience, this class sets them both to 1 when constructed.
 * 
 * @extends dusk.sgui.Grid
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @since 0.0.18-alpha
 * @constructor
 */
dusk.sgui.DynamicGrid = function (parent, comName) {
	dusk.sgui.Grid.call(this, parent, comName);
	
	/** Internal storage for the range used in this component.
	 * @type dusk.Range
	 * @private
	 */
	this._range = null;
	/** The range used for this DynamicGrid, when the value of this changes, the number of elements changes accordingly.
	 * @type dusk.Range
	 */
	this.range = null;
	/** The orientation; this determines whether the DynamicGrid scales horizontaly or vertically.
	 *  
	 * Must be one of the `ORIENT_*` constants in this class.
	 * @type integer
	 * @default dusk.sgui.DynamicGrid.ORIENT_VER
	 */
	this.orientation = dusk.sgui.DynamicGrid.ORIENT_VER;
	/** The population. Saved when the grid populates so it can be used when the value changes.
	 * @type object
	 * @private
	 */
	this._pop = null;
	
	//Default values
	this.rows = 1;
	this.cols = 1;
	
	//Listeners
	this._populationEvent.listen(function(e) {
		this._pop = e.child;
		
		if(this.orientation == dusk.sgui.DynamicGrid.ORIENT_HOR && this.range) {
			this.cols = this.range.value;
		}else if(this.range) {
			this.rows = this.range.value;
		}
		
		return e;
	}, this, {"action":"before"});
	
	//Prop masks
	this._registerPropMask("range", "range");
	this._registerPropMask("orientation", "orientation");
};
dusk.sgui.DynamicGrid.prototype = Object.create(dusk.sgui.Grid.prototype);

dusk.sgui.DynamicGrid.ORIENT_HOR = 0x01;

dusk.sgui.DynamicGrid.ORIENT_VER = 0x02;

//range
Object.defineProperty(dusk.sgui.DynamicGrid.prototype, "range", {
	set: function(value) {
		if(this._range) this._range.onChange.unlisten(this._rangeChanged, this);
		this._range = value;
		if(this._range) this._range.onChange.listen(this._rangeChanged, this);
		this._rangeChanged({});
	},
	
	get: function() {
		return this._range;
	}
});

/** When the range changes, this is called. Repopulates the DynamicGrid with the new value.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.DynamicGrid.prototype._rangeChanged = function(e) {
	if(!this._pop) return false;
	
	this.populate(this._pop);
};

Object.seal(dusk.sgui.DynamicGrid);
Object.seal(dusk.sgui.DynamicGrid.prototype);

dusk.sgui.registerType("DynamicGrid", dusk.sgui.DynamicGrid);
