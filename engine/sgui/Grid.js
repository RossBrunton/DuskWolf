//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Grid", function() {
	var Group = load.require("dusk.sgui.Group");
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var utils = load.require("dusk.utils");
	var PosRect = load.require("dusk.utils.PosRect");
	var sgui = load.require("dusk.sgui");
	
	/** A grid is a group of similar components arranged in a grid.
	 * 
	 * A population is created using the `populate` method  with an object representation containing a type name.
	 *  This will then create numerous copies of that component, in a grid of dimensions `rows` by `cols` with the same
	 *  data.
	 * 
	 * Components are named in the form `"x,y"`, where x and y are the coordinates of the component; the second one to
	 *  the right of the first row will be `"1,0"` for example. This class will, provided the event bubbles from its
	 *  children, manage focus changing between elements.
	 * 
	 * Properties in the `globals` object will be applied to all children in the grid when they are added.
	 * 
	 * Objects are added to the array using the `populate` method or JSON property.
	 * 
	 * When adding a child with display "expand", it will be sized and located so that it takes up an appropriate amount
	 * of the grid. For example, you can create two components next to each other, and have them automatically take up
	 * half the grid, by setting both their displays to expand.
	 * 
	 * The grid creates essentially a "grid" of display regions. This means that the x,y coordinate 0,0 will be the top
	 * left of its grid square, and the width and height of the drawing area (for expand components) will be the
	 * current grid square's width and height.
	 * 
	 * @extends dusk.sgui.Group
	 * @memberof dusk.sgui
	 */
	class Grid extends Group {
		/** Creates a new Grid.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** The number of rows that are to be created when the grid is populated.
			 * @type integer
			 * @default 5
			 * @memberof! dusk.sgui.Grid#
			 */
			this.rows = 5;
			/** The number of columns that are to be created when the grid is populated.
			 * @type integer
			 * @default 5
			 * @memberof! dusk.sgui.Grid#
			 */
			this.cols = 5;
			
			/** The space, in pixels, between each grid component horizontally.
			 * @type integer
			 * @default 0
			 * @memberof! dusk.sgui.Grid#
			 */
			this.hspacing = 0;
			/** The space, in pixels, between each grid component vertically.
			 * 
			 * This takes the value of the theme key `grid.vspacing`, which by default is `0`.
			 * @type integer
			 * @default 0
			 * @memberof! dusk.sgui.Grid#
			 */
			this.vspacing = 0;
			
			/** If true, then the grid's rendering areas won't all be the same width.
			 * 
			 * Instead, each child's rendering area will be the rendering width of only that child.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.Grid#
			 */
			this.varyWidth = false;
			
			/** If true, then the grid's rendering areas won't all be the same height.
			 * 
			 * Instead, each child's rendering area will be the rendering height of only that child.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.Grid#
			 */
			this.varyHeight = false;
			
			/** Global properties. These will be set to all children during population.
			 * @type object
			 * @since 0.0.18-alpha
			 * @memberof! dusk.sgui.Grid#
			 */
			this.globals = null;
			
			/** If true, then old components in the grid will be reused when populating.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @default true
			 * @memberof! dusk.sgui.Grid#
			 */
			this.recycle = true;
			/** If true, then old components will be removed rather than deleted.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.Grid#
			 */
			this.removeOld = false;
			/** If false, then each component description while populating will only be used once.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @default true
			 * @memberof! dusk.sgui.Grid#
			 */
			this.multiple = true;
			
			/** This event handler is fired during three stages of the population proccess; when it starts,
			 *  when a component is added, and when it finishes.
			 * 
			 * The event object has up to three properties:
			 * - `child` The child object data, this may be changed.
			 * - `action` Either `"before"`, `"add"` or `"complete"` depending on the population stage.
			 * - `component` Only on `create` events. This is the component that was created.
			 * - `current` Only on `create` events. This is the object that was used to create the component.
			 * 
			 * The handler MUST return the event object when it is finished with it.
			 * @type dusk.utils.EventDispatcher
			 * @protected
			 * @since 0.0.17-alpha
			 * @memberof! dusk.sgui.Grid#
			 */
			this._populationEvent = new EventDispatcher("dusk.sgui.Grid._populationEvent");
			
			/** The last array of objects used to populate this grid.
			 * @type array<object>
			 * @private
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.Grid#
			 */
			this._lastPopulation = null;
			
			//Prop masks
			this._mapper.map("vspacing", "vspacing");
			this._mapper.map("hspacing", "hspacing");
			this._mapper.map("varyHeight", "varyHeight");
			this._mapper.map("varyWidth", "varyWidth");
			this._mapper.map("rows", "rows");
			this._mapper.map("cols", "cols");
			this._mapper.map("globals", "globals");
			this._mapper.map("recycle", "recycle");
			this._mapper.map("removeOld", "removeOld");
			this._mapper.map("multiple", "multiple");
			this._mapper.map("populate", [function() {return {};}, this.populate],
				["rows", "cols", "hspacing", "vspacing", "varyWidth", "varyHeight", "globals", "recycle", "multiple"]
			);
			
			//Listeners
			this.dirPress.listen(this._gridDirAction.bind(this));
		}
		
		/** Creates a new population of the specified component.
		 * 
		 * This will erase all components in this group unless `recycle` is set to true.
		 * 
		 * It will then loop through all entries in the argument array. If it is an object, create a new component of the
		 * type `value.type`, and then call `dusk.sgui.Component.update` with a copy of `this.globals` then a copy of
		 * `value`. If it is a Component, then that component is renamed to grid coordinates and inserted into this grid.
		 * Behaviour is undefined if a component gets added to the grid multiple times.
		 * 
		 * A non-array argument is treated as a single element array with that value in it.
		 * 
		 * `rows`*`cols` elements will be created, unless `multiple` is set to false and the argument's length is less than
		 * this. In which case, only the number of elements in the array are created.
		 * 
		 * This may be used in the JSON representation with the property `populate`.
		 * 
		 * @param {object|array<object, dusk.sgui.Component>} child A description of the object or objects to set.
		 */
		populate(child) {
			if(child === undefined) return;
			if(!Array.isArray(child)) child = [child];
			this._lastPopulation = child;
			
			//Fire before event
			child = this._populationEvent.firePass({"action":"before", "child":child}, "before").child;
			
			//Delete all the existing ones, or all the out of range one
			if(!this.recycle) {
				for(var x in this._components){
					this.removeOld ? this.remove(x) : this.delete(x);
				}
			}else{
				for(var x in this._components){
					if(x.split(",")[0] > this.cols-1 || x.split(",")[1] > this.rows-1)
						this.removeOld ? this.remove(x) : this.delete(x);
				}
			}
			
			if(this.rows <= 0 || this.cols <= 0) {
				this._populationEvent.firePass({"action":"complete", "child":child}, "complete");
				return;
			}
			
			var p = -1;
			var xpoint = 0;
			var ypoint = 0;
			var ypointMax = 0;
			
			outer:for(var hy = 0; hy < this.rows; hy++){
				for(var hx = 0; hx < this.cols; hx++){
					if((p + 1) >= child.length && !this.multiple) break outer;
					
					p = (p + 1) % child.length;
					
					var com = this._makeComponent(child[p])
					
					com = this._populationEvent.firePass({"action":"add", "current":child[p], "child":child,
						"component":com, "globals":this.globals
					}, "create").component;
					
					this.set(hx+","+hy, com);
				}
			}
			
			this.flow("0,0");
			
			this._populationEvent.fire({"action":"complete", "child":child}, "complete");
		}
		
		_makeComponent(object) {
			if(object instanceof Component) {
				object.update(utils.copy(this.globals, true));
				return object;
			}else{
				// Generate the component
				var com = null;
				if(!("type" in object) && this.globals !== null && "type" in this.globals) {
					com = new (sgui.getType(this.globals.type))(undefined, "");
				}else if("type" in object) {
					com = new (sgui.getType(object.type))(undefined, "");
				}else{
					console.warn("Grid tried to populate element with no type.");
				}
				
				// Fire the event
				
				// Give the component properties
				if(this.globals !== null) com.update(utils.copy(this.globals, true));
				com.update(utils.copy(object, true));
				return com;
			}
		}
		
		/** Changes the focused component in a grid-y way.
		 * @return {boolean} Whether there was a component to flow into, `false` if so, else `true`.
		 * @protected
		 */
		_gridDirAction(e) {
			if(this.focusBehaviour == Group.FOCUS_ALL) return true;
			
			if(this.componentRelative(this.focus, e.dir)){
				this.flow(this.componentRelative(this.focus, e.dir).name);
				return false;
			}
			
			return true;
		}
		
		/** Returns a component that is next to a component in a specified direction.
		 * @param {string} name The component name that should be checked.
		 * @param {integer} dir A constant like `DIR_*` from `{@link dusk.sgui.Component}` that indicates the direction.
		 * @return {?dusk.sgui.Component} The component in that direction, or `null` if it does not exist.
		 * @since 0.0.17-alpha
		 */
		componentRelative(name, dir) {
			var cx = name.split(",")[0];
			var cy = name.split(",")[1];
			
			switch(dir) {
				case c.DIR_LEFT:
					return this.get((+cx-1)+","+cy);
				
				case c.DIR_RIGHT:
					return this.get((+cx+1)+","+cy);
				
				case c.DIR_UP:
					return this.get(cx+","+(+cy-1));
				
				case c.DIR_DOWN:
					return this.get(cx+","+(+cy+1));
				
				default:
					console.warn("Invalid direction for relative seen: "+dir);
					return null;
			}
		}
		
		_groupDraw(e) {
			this._onBeforePaintChildren.fire(e);
			
			var rect = PosRect.pool.alloc();
			var display = PosRect.pool.alloc();
			var slice = PosRect.pool.alloc();
			
			rect.setWH(0, 0, e.d.origin.width, e.d.origin.height);
			
			display.shiftTo(e.d.dest.x, e.d.dest.y);
			display.sizeTo(e.d.dest.width, e.d.dest.height);
			
			slice.setWH(e.d.slice.x, e.d.slice.y, e.d.slice.width, e.d.slice.height);
			
			var eachWidth = (e.d.origin.width - ((this.cols - 1) * this.hspacing)) / (this.cols);
			var eachHeight = (e.d.origin.height - ((this.rows - 1) * this.vspacing)) / (this.rows);
			
			var xp = 0;
			var yp = 0;
			var maxHeight = 0;
			
			// Origin is always the same size unless *VarySize is true
			rect.setWH(0, 0, eachWidth, eachHeight);
			
			for(var y = 0; y < this.rows; y++) {
				for(var x = 0; x < this.cols; x++) {
					var fail = false;
					
					// Vary size
					if(this.varyWidth) {
						eachWidth = this._components[x+","+y].getRenderingWidth();
					}
					
					if(this.varyHeight) {
						if(this._components[x+","+y].getRenderingHeight() > maxHeight) {
							maxHeight = this._components[x+","+y].getRenderingHeight();
						}
						
						eachHeight = this._components[x+","+y].getRenderingHeight();
					}
					
					if(this.varyHeight || this.varyWidth) {
						rect.setWH(0, 0, eachWidth, eachHeight);
					}
					
					slice.setWH(0, 0, rect.width, rect.height);
					display.setWH(
						e.d.dest.x + xp - e.d.slice.x,
						e.d.dest.y + yp - e.d.slice.y,
						eachWidth, eachHeight
					);
					
					if(e.d.slice.x > xp) {
						slice.startSize(e.d.slice.x - xp, 0);
					}
					if(e.d.slice.y > yp) {
						slice.startSize(0, e.d.slice.y - yp);
					}
					
					// Cap dimensions
					if(e.d.slice.ex < xp + slice.width) {
						slice.sizeTo(e.d.slice.ex - xp, slice.height);
						if(slice.width < 0) fail = true;
					}
					
					if(e.d.slice.ey < yp + slice.height) {
						slice.sizeTo(slice.width, e.d.slice.ey - yp);
						if(slice.height < 0) fail = true;
					}
					
					xp += eachWidth + this.hspacing;
					
					if(!fail) {
						this._components[x+","+y].paintContainer(e.c, rect, slice, display);
					}
				}
				
				yp += this.varyHeight ? (maxHeight + this.vspacing) : (eachHeight + this.vspacing);
				maxHeight = 0;
				xp = 0;
			}
			
			PosRect.pool.free(rect);
			PosRect.pool.free(display);
			PosRect.pool.free(slice);
		}
		
		/** Returns the smallest width which has all the components fully drawn inside.
		 * 
		 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
		 * @param {boolean} rendering If true, use their rendering width rather than their stated width.
		 * @return {integer} The smallest possible width where all the components are fully inside.
		 * @since 0.0.21-alpha
		 */
		getContentsWidth(includeOffset, rendering) {
			var max = 0;
			
			for(var y = 0; y < this.rows; y ++) {
				var sum = 0;
				for(var x = 0; x < this.cols; x ++) {
					if(this.get(x+","+y))
						sum += rendering ? this.get(x+","+y).getRenderingWidth() : this.get(x+","+y).width;
				}
				if(sum > max) max = sum;
			}
			
			return max - (includeOffset?this.xOffset:0) + ((this.cols-1)* this.hspacing);
		}
		
		/** Returns the smallest height which has all the components fully drawn inside.
		 * 
		 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
		 * @param {boolean} rendering If true, use their rendering width rather than their stated width.
		 * @return {integer} The smallest possible height where all the components are fully inside.
		 * @since 0.0.21-alpha
		 */
		getContentsHeight(includeOffset, rendering) {
			var sum = 0;
			
			for(var y = 0; y < this.rows; y ++) {
				var max = 0;
				for(var x = 0; x < this.cols; x ++) {
					if(this.get(x+","+y)) {
						var val =  rendering ? this.get(x+","+y).getRenderingHeight() : this.get(x+","+y).height;
						
						if(val > max) max = val;
					}
				}
				sum += max;
			}
			
			return sum + ((this.rows-1)* this.vspacing);
		}
	}
	
	sgui.registerType("Grid", Grid);
	
	return Grid;
});
