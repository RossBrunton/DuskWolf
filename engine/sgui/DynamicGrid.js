//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.DynamicGrid", function() {
	var Grid = load.require("dusk.sgui.Grid");
	var Range = load.require("dusk.utils.Range");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** A dynamic grid is a grid whose rows or columns are tied to a range of values, and will autoupdate itself.
	 * 
	 * It is essentially a grid that an instance of `{@link dusk.utils.Range}` can be attached to.
	 *  When the value of the range changes, the grid repopulates itself such that the number of rows/columns (depending 
	 *   on orientation) matches the range's value.
	 * 
	 * The value that is different from the orientation (rows if vertical, or cols if horizontal) is used as normal,
	 *  though as a convienience, this class sets them both to 1 when constructed.
	 * 
	 * @extends dusk.sgui.Grid
	 * @since 0.0.18-alpha
	 * @memberof dusk.sgui
	 */
	class DynamicGrid extends Grid {
		/** Creates a new DynamicGrid.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** Internal storage for the range used in this component.
			 * @type dusk.utils.Range
			 * @private
			 * @memberof! dusk.sgui.DynamicGrid#
			 */
			this._range = null;
			/** The range used for this DynamicGrid, when the value of this changes, the number of elements changes
			 *  accordingly.
			 * @type dusk.utils.Range
			 * @memberof! dusk.sgui.DynamicGrid#
			 */
			this.range = null;
			/** The id of the "onchanged" listener for range.
			 * @type integer
			 * @private
			 * @since 0.0.20-alpha
			 * @memberof! dusk.sgui.DynamicGrid#
			 */
			this._rangeChangedId = 0;
			
			/** The orientation; this determines whether the DynamicGrid scales horizontaly or vertically.
			 *  
			 * Must be one of the `ORIENT_*` constants in `{@link dusk.sgui.c}`.
			 * @type integer
			 * @default c.ORIENT_VER
			 * @memberof! dusk.sgui.DynamicGrid#
			 */
			this.orientation = c.ORIENT_VER;
			/** The population. Saved when the grid populates so it can be used when the value changes.
			 * @type object
			 * @private
			 * @memberof! dusk.sgui.DynamicGrid#
			 */
			this._pop = null;
			
			//Default values
			this.rows = 1;
			this.cols = 1;
			
			//Listeners
			this._populationEvent.listen((function(e) {
				this._pop = e.child;
				
				if(this.orientation == c.ORIENT_HOR && this.range) {
					this.cols = this.range.value;
				}else if(this.range) {
					this.rows = this.range.value;
				}
				
				return e;
			}).bind(this), "before");
			
			//Prop masks
			this._mapper.map("range", "range");
			this._mapper.map("orientation", "orientation");
		};
		
		//range
		set range(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			this._range = value;
			if(this._range)
				this._rangeChangedId = this._range.onChange.listen(this._rangeChanged.bind(this));
			this._rangeChanged({});
		}
			
		get range() {
			return this._range;
		}
		
		/** When the range changes, this is called. Repopulates the DynamicGrid with the new value.
		 * @param {object} e The event object.
		 * @private
		 */
		_rangeChanged(e) {
			if(!this._pop) return e;
			
			this.populate(this._pop);
			return e;
		}
	}
	
	sgui.registerType("DynamicGrid", DynamicGrid);
	
	return DynamicGrid;
});
