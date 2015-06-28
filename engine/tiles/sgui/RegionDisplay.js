//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.RegionDisplay", (function() {
	var Component = load.require("dusk.sgui.Component");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var Region = load.require("dusk.tiles.Region");
	var dirs = load.require("dusk.utils.dirs");

	/** @class dusk.tiles.sgui.RegionDisplay
	 * 
	 * @classdesc A tile region serves to group tiles, and can colour them.
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
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var RegionDisplay = function (parent, name) {
		Component.call(this, parent, name);
		
		/** The width of a single tile.
		 * @type integer
		 * @default 32
		 */
		this.twidth = 32;
		/** The height of a single tile.
		 * @type integer
		 * @default 32
		 */
		this.theight = 32;
		
		/** The number of rows in this RegionDisplay.
		 * @type integer
		 * @default 50
		 */
		this.rows = 50;
		/** The number of columns in this RegionDisplay.
		 * @type integer
		 * @default 50
		 */
		this.cols = 50;
		
		/** The colours of regions. An array of `[region, colour]` pairs. Entries later in the array will be drawn over
		 *  the rest.
		 * @type object
		 * @private
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
	};
	RegionDisplay.prototype = Object.create(Component.prototype);
	
	RegionDisplay.prototype._updateTileColourCache = function() {
		this._needsCacheUpdating = true;
	};
	
	RegionDisplay.MODE_REGION = 0;
	RegionDisplay.MODE_SUBREGION = 1;
	RegionDisplay.MODE_PATH = 2;
	
	/** Used internally to draw the tilemap.
	 * @param {object} e An `onPaint` event object.
	 * @private
	 */
	RegionDisplay.prototype._tileRegionPaint = function(e) {
		//Update the colour cache if needed
		if(this._needsCacheUpdating) {
			this._cachedTileColours = new Map();
			
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
								this._cachedTileColours.set(i, [n[2], n[3]]);
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
									this._cachedTileColours.set(t[1] * this.cols + t[0], [n[2], n[3]]);
								}
							}
						}
					}
					
					
				}
			}
			
			this._needsCacheUpdating = false;
		}
		
		
		for(c of this._cachedTileColours) {
			var x = c[0] % this.cols;
			var y = ~~(c[0] / this.cols);
			
			if((x+1) * this.tileWidth() < e.d.slice.x
			|| x * this.tileWidth() > e.d.slice.x + e.d.width
			|| (y+1) * this.tileHeight() < e.d.slice.y
			|| y * this.tileHeight() > e.d.slice.y + e.d.height) {
				continue;
			}
			
			var margin = "margin" in c[1][1] ? c[1][1].margin : 1;
			
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
				var alpha = "alpha" in c[1][1] ? c[1][1].alpha : 1.0;
				
				var oldAlpha = e.c.globalAlpha;
				e.c.globalAlpha *= alpha;
				e.c.fillStyle = c[1][0];
				e.c.fillRect(destx, desty, dwidth, dheight);
				e.c.globalAlpha = oldAlpha;
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
						this._cachedArrows.set(lastY * this.cols + lastX, [n[2], _arrowThrough(last, enter)]);
					}
					last = enter;
					lastX = x;
					lastY = y;
				}).bind(this));
				this._cachedArrows.set(lastY * this.cols + lastX, [n[2], _arrowThrough(last, dirs.NONE)]);
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
	};
	
	RegionDisplay.prototype._arrowSide = function(now, region, x, y) {
		var rel = region.getAll(x, y);
		
		if(!rel.length) return false;
		
		for(var i = 0; i < rel.length; i ++) {
			if(rel[i][6] == now[6] + 1) return true;
			if(rel[i][6] == now[6] - 1) return true;
		}
		
		return false;
	};
	
	var _arrowThrough = function(enter, exit) {
		return _getArrow(
			enter == dirs.NONE,
			enter == dirs.E || exit == dirs.W,
			enter == dirs.W || exit == dirs.E,
			enter == dirs.S || exit == dirs.N,
			enter == dirs.N || exit == dirs.S
		);
	};
	
	var _getArrow = function(init, left, right, up, down) {
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
	};
	
	RegionDisplay.prototype.display = function(name, mode, colour, options, obj1, obj2) {
		if(mode != RegionDisplay.MODE_PATH && !Array.isArray(obj1)) obj1 = [obj1];
		this._paint.push([name, mode, colour, options, obj1, obj2]);
		this._updateTileColourCache();
	};
	
	RegionDisplay.prototype.unDisplay = function(name) {
		for(var i = 0; i < this._paint.length; i ++) {
			if(this._paint[i][0] == name) {
				this._paint.splice(i, 1);
				break;
			}
		}
		
		this._updateTileColourCache();
	};
	
	RegionDisplay.prototype.getDisplay = function(name) {
		for(var p of this._paint) {
			if(p[0] == name) {
				return p;
			}
		}
		
		return undefined;
	};
	
	
	/** Returns the width of a single tile.
	 * @return {integer} The width of a tile.
	 */
	RegionDisplay.prototype.tileWidth = function() {
		return this.twidth;
	};
	
	/** Returns the height of a single tile.
	 * @return {integer} The height of a tile.
	 */
	RegionDisplay.prototype.tileHeight = function() {
		return this.theight;
	};
	
	/** Returns the number of visible columns.
	 * @return {integer} The number of visible columns.
	 */
	RegionDisplay.prototype.visibleCols = function() {
		return Math.floor(this.width/this.tileWidth());
	};
	
	/** Returns the number of visible rows.
	 * @return {integer} The number of visible columns.
	 */
	RegionDisplay.prototype.visibleRows = function() {
		return Math.floor(this.height/this.tileHeight());
	};
	
	//width
	Object.defineProperty(RegionDisplay.prototype, "width", {
		get: function() {return this.cols*this.twidth;},
		set: function(value) {if(value > 0) console.warn("RegionDisplay setting width is not supported.");}
	});
	
	//height
	Object.defineProperty(RegionDisplay.prototype, "height", {
		get: function() {return this.rows*this.theight;},
		set: function(value) {if(value > 0) console.warn("RegionDisplay setting height is not supported.");}
	});
	
	/* Loads a map from an object. This is used by `{@link dusk.rooms.sgui.LayeredRoom}`.
	 * 
	 * @param {object} map The map to load, will be assigned to `{@link dusk.tiles.sgui.EditableTileMap#map}`.
	 * @since 0.0.18-alpha
	 */
	RegionDisplay.prototype.loadBM = function(data) {};
	
	sgui.registerType("RegionDisplay", RegionDisplay);
	
	return RegionDisplay;
})());
