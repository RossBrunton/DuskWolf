//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.RegionDisplay", function() {
	var Component = load.require("dusk.sgui.Component");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var Region = load.require("dusk.tiles.Region");
	var dirs = load.require("dusk.utils.dirs");

	/** A tile region serves to group tiles, and can colour them.
	 * 
	 * Generally, a region represents a grid of identical sized tiles. Each tile can be in a number of regions, and
	 * contain basic pathing information on how to get from a "starting point". Regions can also have all the tiles in 
	 * them coloured, as well.
	 * 
	 * Tiles can be added to regions individually, but it is more usefull to use
	 *  `{@link dusk.tiles.sgui.RegionDisplay#expandRegion}` to create a region that, essentially, says "Every
	 *  tile that is n tiles away from a given tile". If you use `expandRegion`, you get paths to and from the "origin"
	 *  tile for free.
	 * 
	 * @extends dusk.sgui.Component
	 * @memberof dusk.tiles.sgui
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	class RegionDisplay extends Component {
		/** Creates a new RegionDisplay
		 * 
		 * @param {?dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} componentName The name of the component.
		 * @since 0.0.21-alpha
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** The width of a single tile.
			 * @type integer
			 * @default 32
			 * @memberof! dusk.tiles.sgui.RegionDisplay#
			 */
			this.twidth = 32;
			/** The height of a single tile.
			 * @type integer
			 * @default 32
			 * @memberof! dusk.tiles.sgui.RegionDisplay#
			 */
			this.theight = 32;
			
			/** The number of rows in this RegionDisplay.
			 * @type integer
			 * @default 50
			 * @memberof! dusk.tiles.sgui.RegionDisplay#
			 */
			this.rows = 50;
			/** The number of columns in this RegionDisplay.
			 * @type integer
			 * @default 50
			 * @memberof! dusk.tiles.sgui.RegionDisplay#
			 */
			this.cols = 50;
			
			/** The colours of regions. An array of `[region, colour]` pairs. Entries later in the array will be drawn over
			 *  the rest.
			 * @type object
			 * @private
			 * @memberof! dusk.tiles.sgui.RegionDisplay#
			 */
			this._cachedTileColours = new Map();
			this._cachedArrows = new Map();
			this._needsCacheUpdating = false;
			this._paint = [];
			this._invertStyle = null;
			
			//Prop masks
			this._mapper.map("rows", "rows");
			this._mapper.map("cols", "cols");
			
			this._mapper.map("theight", "theight");
			this._mapper.map("twidth", "twidth");
			
			this._mapper.map("paint", "paint");
			
			//Listeners
			this.onPaint.listen(this._tileRegionPaint.bind(this));
		}
		
		_updateTileColourCache() {
			this._needsCacheUpdating = true;
		}
		
		static get MODE_REGION() {return 0;}
		static get MODE_SUBREGION() {return 1;}
		static get MODE_PATH() {return 2;}
		
		/** Used internally to draw the tilemap.
		 * @param {object} e An `onPaint` event object.
		 * @private
		 */
		_tileRegionPaint(e) {
			//Update the colour cache if needed
			if(this._needsCacheUpdating) {
				this._cachedTileColours = new Map();
				
				var update = function(i, n) {
					if(this._cachedTileColours.has(i)) {
						if("overlaps" in n[3]) {
							var a = this._cachedTileColours.get(i);
							
							var na = [];
							
							for(var ent of a) {
								if(n[3].overlaps.includes(ent[2])) {
									na.push(ent);
								}
							}
							
							na.push([n[2], n[3], n[0]]);
							this._cachedTileColours.set(i, na);
							
							return;
						}
						
						this._cachedTileColours.set(i, [[n[2], n[3], n[0]]]);
					}else{
						this._cachedTileColours.set(i, [[n[2], n[3], n[0]]]);
					}
				}.bind(this);
				
				//Loop through all regions
				for(var n of this._paint) {
					if(n[1] != RegionDisplay.MODE_PATH) {
						var tiles = null;
						
						if(n[3].invert) {
							var dontColour = [];
							
							for(var ts of n[4]) {
								if(n[1] == RegionDisplay.MODE_REGION) {
									tiles = ts.all();
								}else if(n[1] == RegionDisplay.MODE_SUBREGION) {
									tiles = ts.allSub(n[5]);
								}
								
								for(var t of tiles) {
									if(n[1] != RegionDisplay.MODE_REGION || t[Region.tfields.stoppable]
									|| n[3].allowUnstoppable) {
										dontColour.push(t[1] * this.cols + t[0]);
									}
								}
							}
							
							for(var i = 0; i < this.cols*this.rows; i ++) {
								if(!dontColour.includes(i)) {
									update(i, n);
								}
							}
						}else{
							for(var ts of n[4]) {
								if(n[1] == RegionDisplay.MODE_REGION) {
									tiles = ts.all();
								}else if(n[1] == RegionDisplay.MODE_SUBREGION) {
									tiles = ts.allSub(n[5]);
								}
								
								for(var t of tiles) {
									if(n[1] != RegionDisplay.MODE_REGION || t[Region.tfields.stoppable]
									|| n[2].allowUnstoppable) {
										update(t[1] * this.cols + t[0], n);
									}
								}
							}
						}
						
						
					}
				}
				
				this._needsCacheUpdating = false;
			}
			
			
			for(var c of this._cachedTileColours) {
				for(var t of c[1]) {
					var x = c[0] % this.cols;
					var y = ~~(c[0] / this.cols);
					
					if((x+1) * this.tileWidth() < e.d.slice.x
					|| x * this.tileWidth() > e.d.slice.x + e.d.width
					|| (y+1) * this.tileHeight() < e.d.slice.y
					|| y * this.tileHeight() > e.d.slice.y + e.d.height) {
						continue;
					}
					
					var margin = "margin" in t[1] ? t[1].margin : 1;
					
					var destx = e.d.dest.x + ((x * this.twidth) - e.d.slice.x) + margin;
					var desty = e.d.dest.y + ((y * this.theight) - e.d.slice.y) + margin;
					
					var dwidth = this.twidth - margin * 2;
					var dheight = this.theight - margin * 2;
					
					if(destx < e.d.dest.x) {
						dwidth -= e.d.dest.x - destx;
						destx = e.d.dest.x;
					}
					
					if(desty < e.d.dest.y) {
						dheight -= e.d.dest.y - desty;
						desty = e.d.dest.y;
					}
					
					if(destx + dwidth > e.d.dest.x + e.d.slice.width) dwidth = (e.d.dest.x + e.d.slice.width) - destx;
					if(desty + dheight > e.d.dest.y + e.d.slice.height) dheight = (e.d.dest.y + e.d.slice.height) - desty;
					
					if(dwidth > 0 && dheight > 0) {
						var alpha = "alpha" in t[1] ? t[1].alpha : 1.0;
						
						var oldAlpha = e.c.globalAlpha;
						e.c.globalAlpha *= alpha;
						e.c.fillStyle = t[0];
						e.c.fillRect(destx, desty, dwidth, dheight);
						e.c.globalAlpha = oldAlpha;
					}
				}
			}
			
			
			this._cachedArrows = new Map();
			for(var n of this._paint) {
				if(n[1] == RegionDisplay.MODE_PATH) {
					var last = undefined;
					var lastX = undefined;
					var lastY = undefined;
					n[4].forEach((function(x, y, z, enter, stop) {
						if(last !== undefined) {
							this._cachedArrows.set(lastY * this.cols + lastX, [n[2], this._arrowThrough(last, enter)]);
						}
						last = enter;
						lastX = x;
						lastY = y;
					}).bind(this));
					this._cachedArrows.set(lastY * this.cols + lastX, [n[2], this._arrowThrough(last, dirs.NONE)]);
				}
			}
			
			for(var a of this._cachedArrows) {
				var x = a[0] % this.cols;
				var y = ~~(a[0] / this.cols);
				
				var img = new Image(a[1][0]);
				
				if(img.isReady()) {
					var destx = e.d.dest.x + ((x * this.twidth) - e.d.slice.x) + 1;
					var desty = e.d.dest.y + ((y * this.theight) - e.d.slice.y) + 1;
					
					var dwidth = this.twidth -2;
					var dheight = this.theight -2;
					
					var xoff = 0;
					var yoff = 0;
					
					if(destx < e.d.dest.x) {
						xoff = e.d.dest.x - destx;
						destx = e.d.dest.x;
					}
					
					if(desty < e.d.dest.y) {
						yoff = e.d.dest.y - desty;
						desty = e.d.dest.y;
					}
					
					if(destx + dwidth > e.d.dest.x + e.d.slice.width) dwidth = (e.d.dest.x + e.d.slice.width) - destx;
					if(desty + dheight > e.d.dest.y + e.d.slice.height) dheight = (e.d.dest.y + e.d.slice.height) - desty;
					
					var hscale = img.tileWidth / this.twidth;
					var vscale = img.tileHeight / this.theight;
					
					if(dwidth-xoff > 0 && dheight-yoff > 0) {
						img.paint(e.c, [], false,
							a[1][1][0] * img.tileWidth + (xoff * hscale), a[1][1][1] * img.tileHeight + (yoff * vscale), 
							(dwidth - xoff) * hscale, (dheight - yoff) * vscale,
							
							destx, desty, dwidth - xoff, dheight - yoff
						);
					}
				}
			}
		}
		
		_arrowSide(now, region, x, y) {
			var rel = region.getAll(x, y);
			
			if(!rel.length) return false;
			
			for(var i = 0; i < rel.length; i ++) {
				if(rel[i][6] == now[6] + 1) return true;
				if(rel[i][6] == now[6] - 1) return true;
			}
			
			return false;
		}
		
		_arrowThrough(enter, exit) {
			return this._getArrow(
				enter == dirs.NONE,
				enter == dirs.E || exit == dirs.W,
				enter == dirs.W || exit == dirs.E,
				enter == dirs.S || exit == dirs.N,
				enter == dirs.N || exit == dirs.S
			);
		}
		
		_getArrow(init, left, right, up, down) {
			if(up && down && left && right) return [1, 0];
			if(!up && !down && !left && !right) return [0, 0];
			
			if(up && down && !left && right) return [0, 4];
			if(!up && down && left && right) return [1, 4];
			if(up && down && left && !right) return [2, 4];
			if(up && !down && left && right) return [3, 4];
			
			if(!up && down && !left && right) return [0, 3];
			if(!up && down && left && !right) return [1, 3];
			if(up && !down && left && !right) return [2, 3];
			if(up && !down && !left && right) return [3, 3];
			
			if(up && down && !left && !right) return [2, 0];
			if(!up && !down && left && right) return [3, 0];
			
			if(init) {
				if(right) return [0, 1];
				if(left) return [1, 1];
				if(up) return [2, 1];
				if(down) return [3, 1];
			}else{
				if(right) return [0, 2];
				if(left) return [1, 2];
				if(up) return [2, 2];
				if(down) return [3, 2];
			}
		}
		
		display(name, mode, colour, options, obj1, obj2) {
			if(mode != RegionDisplay.MODE_PATH && !Array.isArray(obj1)) obj1 = [obj1];
			this._paint.push([name, mode, colour, options, obj1, obj2]);
			this._updateTileColourCache();
		}
		
		unDisplay(name) {
			for(var i = 0; i < this._paint.length; i ++) {
				if(this._paint[i][0] == name) {
					this._paint.splice(i, 1);
					break;
				}
			}
			
			this._updateTileColourCache();
		}
		
		getDisplay(name) {
			for(var p of this._paint) {
				if(p[0] == name) {
					return p;
				}
			}
			
			return undefined;
		}
		
		
		/** Returns the width of a single tile.
		 * @return {integer} The width of a tile.
		 */
		tileWidth() {
			return this.twidth;
		}
		
		/** Returns the height of a single tile.
		 * @return {integer} The height of a tile.
		 */
		tileHeight() {
			return this.theight;
		}
		
		/** Returns the number of visible columns.
		 * @return {integer} The number of visible columns.
		 */
		visibleCols() {
			return Math.floor(this.width/this.tileWidth());
		}
		
		/** Returns the number of visible rows.
		 * @return {integer} The number of visible columns.
		 */
		visibleRows() {
			return Math.floor(this.height/this.tileHeight());
		}
		
		get width() {return this.cols*this.twidth;}
		set width(value) {if(value > 0) console.warn("RegionDisplay setting width is not supported.");}
		
		get height() {return this.rows*this.theight;}
		set height(value) {if(value > 0) console.warn("RegionDisplay setting height is not supported.");}
		
		/* Loads a map from an object. This is used by `{@link dusk.rooms.sgui.LayeredRoom}`.
		 * 
		 * @param {object} map The map to load, will be assigned to `{@link dusk.tiles.sgui.EditableTileMap#map}`.
		 * @since 0.0.18-alpha
		 */
		loadBM(data) {};
	}
	
	sgui.registerType("RegionDisplay", RegionDisplay);
	
	return RegionDisplay;
});
