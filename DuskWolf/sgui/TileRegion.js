//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.TileRegion", (function() {
	var Component = load.require("dusk.sgui.Component");
	var TileMap = load.require("dusk.sgui.TileMap");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.Image");

	/** @class dusk.sgui.TileRegion
	 * 
	 * @classdesc A tile region serves to group tiles, and can colour them.
	 * 
	 * Generally, a region represents a grid of identical sized tiles. Each tile can be in a number of regions, and contain
	 *  basic pathing information on how to get from a "starting point". Regions can also have all the tiles in them
	 *  coloured, as well.
	 * 
	 * Tiles can be added to regions individually, but it is more usefull to use `{@link dusk.sgui.TileRegion#expandRegion}`
	 *  to create a region that, essentially, says "Every tile that is n tiles away from a given tile". If you use
	 *  `expandRegion`, you get paths to and from the "origin" tile for free.
	 * 
	 * @extends dusk.sgui.Component
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var TileRegion = function (parent, comName) {
		Component.call(this, parent, comName);
		
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
		
		/** The number of rows in this TileRegion.
		 * @type integer
		 * @default 50
		 */
		this.rows = 50;
		/** The number of columns in this TileRegion.
		 * @type integer
		 * @default 50
		 */
		this.cols = 50;
		
		/** Full data for all the regions, key is the region name, and value is an array of form `[x, y, parentX, parentY, 
		 *  weight, entity, distance]`. The first entry of these arrays are always null. The origin tile has a `parentX` and
		 *  a `parentY` of `-1`.
		 * @type object
		 * @private
		 */
		this._regions = {};
		/** The original tile in a region. Key is the region name, and the value is a shortcut to the origin tile in 
		 *  `{@link dusk.sgui.TileRegion#_regions}`.
		 * @type object
		 * @private
		 */
		this._regionOrigins = {};
		/** An object containing arrays for fast lookups. Key is region name, the value is a Uint16Array. The value
		 *  `(y * cols) + x` is the index of the tile at that location in `{@link dusk.sgui.TileRegion#_regions}` or 0
		 *  (the tile is not in the region).
		 * @type object
		 * @private
		 */
		this._regionMaps = {};
		/** An object containing an array of all entities in the region. How nice. Key is the region name. Value is an
		 *  `[entity, tile]` pair.
		 * @type object
		 * @private
		 */
		this._regionEnts = {};
		
		/** The colours of regions. An array of `[region, colour]` pairs. Entries later in the array will be drawn over
		 *  the rest.
		 * @type object
		 * @private
		 */
		this._tagColours = [];
		this._cachedTileColours = [];
		this._needsCacheUpdating = false;
		
		//Prop masks
		this._registerPropMask("rows", "rows");
		this._registerPropMask("cols", "cols");
		
		this._registerPropMask("theight", "theight");
		this._registerPropMask("twidth", "twidth");
		
		//Listeners
		this.prepareDraw.listen(this._tileRegionDraw.bind(this));
		this.frame.listen(this._tileRegionFrame.bind(this));
	};
	TileRegion.prototype = Object.create(Component.prototype);

	/** Returns the location of the source tile on the origin image
	 *  (as in, the one that was drawn to here) that the specified coordinate is in.
	 * 
	 * Please return the output to `{@link dusk.sgui.TileRegion.tileData}` when you are done.
	 * @param {integer} x The x coordinate to look in.
	 * @param {integer} y The y coordinate to look in.
	 * @param {boolean=false} exactX If true
	 *  then the specified x coordinate must exactly match the x coordinate of a tile on this map.
	 * @param {boolean=false} exactY If true
	 *  then the specified y coordinate must exactly match the y coordinate of a tile on this map.
	 * @return {?array} An `[x,y]` array specifying the tile that is here, or `null`, if there is no tile here.
	 */
	TileRegion.prototype.tilePointIn = function(x, y, exactX, exactY) {
		var xpt = x/this.twidth;
		var ypt = y/this.theight;
		
		if(exactX && exactY){
			return this.getTile(xpt, ypt);
		}else if(exactX){
			return this.getTile(xpt, ~~ypt);
		}else if(exactY){
			return this.getTile(~~xpt, ypt);
		}else{
			return this.getTile(~~xpt, ~~ypt);
		}
	};

	/** Used internally to manage frames.
	 * @param {object} e A `frame` event object.
	 * @private
	 */
	TileRegion.prototype._tileRegionFrame = function(e) {
		
	};

	TileRegion.prototype._updateTileColourCache = function() {
		this._needsCacheUpdating = true;
	};

	/** Used internally to draw the tilemap.
	 * @param {object} e A `prepareDraw` event object.
	 * @private
	 */
	TileRegion.prototype._tileRegionDraw = function(e) {
		//Update the colour cache if needed
		if(this._needsCacheUpdating) {
			this._cachedTileColours = [];
			
			//Loop through all regions
			for(var i = 0; i < this._tagColours.length; i ++) {
				var t = this._tagColours[i];
				var r = this.getRegion(t[0]);
				
				if(r) {
					//Loop through every tile (r is region, t is pair [regionName, regionColour])
					for(var j = 1; j < r.length; j ++) {
						var set = false;
						
						var add = 0;
						
						//Arrows go over the top of everything
						if(t[1].charAt(0) != ":") {
							for(var k = 0; k < this._cachedTileColours.length; k ++) {
								if(this._cachedTileColours[k][0] == r[j][0] && this._cachedTileColours[k][1] == r[j][1]) {
									set = true;
									this._cachedTileColours[k][2] = t[1];
									add = k;
								}
							}
						}
						
						if(!set) {
							//x, y, colour, px, py
							this._cachedTileColours.push([r[j][0], r[j][1], t[1], r[j][2], r[j][3]]);
							add = this._cachedTileColours.length -1;
						}
						
						//Arrows
						if(t[1].charAt(0) == ":") {
							var out = this._getArrow(r[j][2] == -1,
								this._arrowSide(r[j], t[0], r[j][0]-1, r[j][1]),
								this._arrowSide(r[j], t[0], r[j][0]+1, r[j][1]),
								this._arrowSide(r[j], t[0], r[j][0], r[j][1]-1),
								this._arrowSide(r[j], t[0], r[j][0], r[j][1]+1)
							);
							this._cachedTileColours[add][5] = out[0];
							this._cachedTileColours[add][6] = out[1];
						}
					}
				}
			}
			
			this._needsCacheUpdating = false;
		}
		
		
		for(var i = 0; i < this._cachedTileColours.length; i ++) {
			var c = this._cachedTileColours[i];
			
			if((c[0]+1) * this.tileWidth() < e.d.sourceX
			|| c[0] * this.tileWidth() > e.d.sourceX + e.d.width
			|| (c[1]+1) * this.tileHeight() < e.d.sourceY
			|| c[1] * this.tileHeight() > e.d.sourceY + e.d.height) {
				continue;
			}
			
			if(c[2].charAt(0) != ":") {
				e.c.fillStyle = c[2];
				e.c.fillRect(
					e.d.destX + ((c[0] * this.tileWidth()) - e.d.sourceX) + 1,
					e.d.destY + ((c[1] * this.tileHeight()) - e.d.sourceY) + 1,
					this.tileWidth() - 2, this.tileHeight() - 2
				);
			}else{
				var img = new Image(c[2].substring(1));
				if(img.isReady()) {
					var hscale = 1//this.swidth/this.width;
					var vscale = 1//this.sheight/this.height;
					img.paintScaled(e.c, [], false,
						c[5] * this.tileWidth(), c[6] * this.tileHeight(), 
						this.tileWidth()*hscale, this.tileWidth()*vscale,
						
						e.d.destX + ((c[0] * this.tileWidth()) - e.d.sourceX),
						e.d.destY + ((c[1] * this.tileHeight()) - e.d.sourceY),
						this.tileWidth(), this.tileHeight(),
						1, 1
					);
				}
			}
			
			/*e.c.fillText(c[3]+","+c[4],
				e.d.destX - e.d.sourceX + (c[0]*this.tileWidth()) + 1,
				e.d.destY - e.d.sourceY + (c[1]*this.tileHeight()) + 6
			);
			
			e.c.fillText(c[0]+","+c[1],
				e.d.destX - e.d.sourceX + (c[0]*this.tileWidth()) + 1,
				e.d.destY - e.d.sourceY + (c[1]*this.tileHeight()) + 18
			);*/
			
			/*e.c.fillText(this._resolveDirection(c[3], c[4], c[0], c[1]),
				e.d.destX - e.d.sourceX + (c[0]*this.tileWidth()) + 1,
				e.d.destY - e.d.sourceY + (c[1]*this.tileHeight()) + 18
			);*/
		}
	};

	TileRegion.prototype._arrowSide = function(now, region, x, y) {
		var rel = this.getAllFromRegion(region, x, y);
		
		if(!rel.length) return false;
		
		for(var i = 0; i < rel.length; i ++) {
			if(rel[i][6] == now[6] + 1) return true;
			if(rel[i][6] == now[6] - 1) return true;
		}
		
		return false;
	};

	TileRegion.prototype._getArrow = function(init, left, right, up, down) {
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

	TileRegion.prototype.clearRegion = function(name) {
		this._regions[name] = undefined;
		this._regionMaps[name] = undefined;
		this._regionEnts[name] = undefined;
		
		this._updateTileColourCache();
	};

	TileRegion.prototype.addToRegion = function(name, x, y, px, py, weight, e, dist, evenEnt) {
		if(!(name in this._regions) || !this._regions[name]) {
			this._regions[name] = [null];
			this._regionMaps[name] = new Uint16Array(this.rows * this.cols);
			this._regionEnts[name] = [];
		}
		
		this._regions[name].push([x, y, px, py, weight, e, dist]);
		this._regionMaps[name][(y * this.cols)+x] = this._regions[name].length-1;
		if(evenEnt && e) this._regionEnts[name].push([e, this._regions[name].length-1]);
		this._updateTileColourCache();
	};

	TileRegion.prototype.getFromRegion = function(name, x, y) {
		if(!(name in this._regions) || !this._regions[name]) this._regions[name] = [];
		
		return this._regions[name][this._regionMaps[name][(y * this.cols) + x]];
	};

	TileRegion.prototype.getAllFromRegion = function(name, x, y) {
		if(!(name in this._regions) || !this._regions[name]) this._regions[name] = [];
		
		var out = [];
		
		for(var i = 0; i < this._regions[name].length; i ++) {
			if(this._regions[name][i] && this._regions[name][i][0] == x && this._regions[name][i][1] == y) {
				out.push(this._regions[name][i]);
			}
		}
		
		return out;
	};

	TileRegion.prototype.isInRegion = function(name, x, y) {
		if(!(name in this._regions) || !this._regions[name]) return false;
		
		return this._regionMaps[name][(y * this.cols) + x] != 0;
	};

	TileRegion.prototype.getRegion = function(name) {
		return this._regions[name];
	};

	TileRegion.prototype.entitiesInRegion = function(name) {
		return this._regionEnts[name];
	};

	TileRegion.prototype.pathTo = function(name, x, y) {
		var o = [];
		var t = this.getFromRegion(name, x, y);
		
		while(t && t[2] >= 0) {
			o.push(this._resolveDirection(t[2], t[3], t[0], t[1]));
			t = this.getFromRegion(name, t[2], t[3]);
		}
		
		return o.reverse();
	};

	TileRegion.prototype.followPathFromRegion = function(path, origin, dest) {
		var o = [-1, -1];
		var t = [this._regionOrigins[origin][0], this._regionOrigins[origin][1]];
		var p = 0;
		
		while(p <= path.length) {
			this.addToRegion(dest, t[0], t[1], o[0], o[1], undefined, undefined, p);
			o[0] = t[0];
			o[1] = t[1];
			t = this._goDirection(t[0], t[1], path[p]);
			p ++;
		}
	};

	TileRegion.prototype.followPath = function(path, region) {
		var o = [-1, -1];
		var t = [this._regionOrigins[region][0], this._regionOrigins[region][1]];
		var p = 0;
		
		while(p <= path.length) {
			o[0] = t[0];
			o[1] = t[1];
			t = this._goDirection(t[0], t[1], path[p]);
			p ++;
		}
		
		return o;
	};

	TileRegion.prototype.expandRegion = function(name, x, y, range, opts) {
		var s = this.container.getScheme();
		
		var w = 0;
		var o = this.container.getPrimaryEntityLayer().getEntitiesExactlyHere(
			x*this.tileWidth(), y*this.tileHeight(), undefined, true
		);
		
		var e = null;
		if(o.length > 0) {
			e = o[0];
		}
		
		if(opts.includeFirst) {
			w = this._entityWeight(e);
		}
		
		if("rangeMap" in opts) range = opts.rangeMap.length -1;
		if(range < 0) return;
		
		//if("notStartFrom" in opts && e && e.meetsTrigger(opts.notStartFrom)) return;
		//Remember to ignore selector
		
		var cloud = [[x, y, -1, -1, w, e, 0]];
		
		this._regionOrigins[name] = cloud[0];
		
		if("weights" in opts) s.weights = opts.weights;
		while(true) {
			var cl = this._getMinFromCloud(cloud);
			if(cl[4] == 0xffffffff) break;
			
			var t = s.getTile(cl[0], cl[1]);
			
			if(/*!this.isInRegion(name, c[0], c[1])*/ true) {
				if(!("entBlock" in opts) || !cl[5] || !cl[5].evalTrigger(opts.entBlock)) {
					if(!opts.los || this.checkLOS(name, x, y, cl[0], cl[1])) {
						s.shiftTile(t, c.DIR_UP);
						this._updateCloud(cloud, cl, t, range, name);
						s.shiftTile(t, c.DIR_DOWN);
					
						s.shiftTile(t, c.DIR_RIGHT);
						this._updateCloud(cloud, cl, t, range, name);
						s.shiftTile(t, c.DIR_LEFT);
					
						s.shiftTile(t, c.DIR_DOWN);
						this._updateCloud(cloud, cl, t, range, name);
						s.shiftTile(t, c.DIR_UP);
					
						s.shiftTile(t, c.DIR_LEFT);
						this._updateCloud(cloud, cl, t, range, name);
						
						if(!this.isInRegion(name, cl[0], cl[1]) && (!opts.min || cl[4] > opts.min)) {
							if((!("minWeight" in opts) || cl[4] >= opts.minWeight)
							&& (!("rangeMap" in opts) || opts.rangeMap[cl[4]])) {
								if(!("entFilter" in opts) || !cl[5]) {
									this.addToRegion(name, cl[0], cl[1], cl[2], cl[3], cl[4], cl[5], cl[6], true);
								}else{
									this.addToRegion(
										name, cl[0], cl[1], cl[2], cl[3], cl[4], cl[5], cl[6],
										cl[5].evalTrigger(opts.entFilter)
									);
								}
								
								if("forEach" in opts) {
									for(var i = 0; i < opts.forEach.length; i ++) {
										var e = opts.forEach[i];
										this.expandRegion(e.name, cl[0], cl[1], e.range, e);
									}
								}
							}
						}
					}
				}
				
				cl[4] = 0xffffffff;
			}
			
			TileMap.tileData.free(t);
		}
		
		if(opts.colour) this.colourRegion(name, opts.colour);
	};

	TileRegion.prototype._isInCloud = function(cloud, c, tile) {
		if(c[0] == tile[2] && c[1] == tile[3]) return c;
		
		for(var i = 0; i < cloud.length; i ++) {
			if(cloud[i][0] == tile[2] && cloud[i][1] == tile[3]) return cloud[i];
		}
		
		return null;
	};

	TileRegion.prototype._updateCloud = function(cloud, oldTile, newTile, range, region) {
		this._calls ++;
		var exists = this._isInCloud(cloud, oldTile, newTile);
		if(exists && exists[4] == 0xffffffff) return;
		
		var e = null;
		var w = 0;
		
		if(!exists) {
			var o = this.container.getPrimaryEntityLayer().getEntitiesExactlyHere(
				newTile[2]*this.tileWidth(), newTile[3]*this.tileHeight(), undefined, true
			);
			
			if(o.length > 0) {
				e = o[0];
				w = this._entityWeight(e);
			}
		}else{
			if(exists[5]) {
				e = exists[5];
				w = this._entityWeight(e);
			}
		}
		
		if(oldTile[4] + newTile[4] + w > range) return;
		
		if(exists) {
			if(oldTile[4] + newTile[4] + w < exists[4]) {
				exists[2] = oldTile[0];
				exists[3] = oldTile[1];
				exists[4] = oldTile[4] + newTile[4] + w;
				exists[6] = oldTile[6] + 1;
			}
		}else{
			cloud.push(
				[newTile[2], newTile[3], oldTile[0], oldTile[1], oldTile[4]+newTile[4]+w, e, oldTile[6]+1]
			);
		}
	};

	TileRegion.prototype._entityWeight = function(e) {
		if(!e || !e.eProp("regionWeight")) {
			return 0;
		}
		
		return e.eProp("regionWeight");
	};

	TileRegion.prototype._getMinFromCloud = function(cloud, pop) {
		var min = 0;
		for(var i = 1; i < cloud.length; i ++) {
			if(cloud[i][4] < cloud[min][4]) {
				min = i;
			}
		}
		
		var toRet = cloud[min];
		return toRet;
	};

	TileRegion.prototype.checkLOS = function(name, xa, ya, xb, yb) {
		function abs(a) {return a > 0 ? a : -a;}

		var dx = abs(xb - xa);
		var dy = abs(yb - ya);
		
		var sx = -1;
		var sy = -1;
		
		if(xa < xb) sx = 1;
		if(ya < yb) sy = 1;
		
		var err = dx - dy;
		
		var s = this.container.getScheme();
		while(true) {
			var t = s.getTile(xa, ya);
			if(t[5]) {
				TileMap.tileData.free(t);
				return false;
			}
			TileMap.tileData.free(t);
			
			if(xa == xb && ya == yb) break;
			
			var e2 = 2 * err;
			
			if(e2 > -dy) { 
				err -= dy;
				xa += sx;
			}
			if(e2 < dx){
				err += dx;
				ya += sy;
			}
		}
		
		return true;
	};

	//a is D of b
	TileRegion.prototype._resolveDirection = function(xa, ya, xb, yb) {
		if(xa == xb + 1) return c.DIR_LEFT;
		if(xa == xb - 1) return c.DIR_RIGHT;
		if(ya == yb + 1) return c.DIR_UP;
		if(ya == yb - 1) return c.DIR_DOWN;
	};

	TileRegion.prototype._goDirection = function(x, y, dir) {
		switch(dir) {
			case c.DIR_LEFT: return [x-1, y];
			case c.DIR_RIGHT: return [x+1, y];
			case c.DIR_UP: return [x, y-1];
			case c.DIR_DOWN: return [x, y+1];
		}
	};


	TileRegion.prototype.colourRegion = function(name, colour) {
		for(var i = 0; i < this._tagColours.length; i ++) {
			if(this._tagColours[i][0] == name) {
				this._tagColours[i][1] = colour;
				this._updateTileColourCache();
				return;
			}
		}
		
		this._tagColours.push([name, colour]);
		this._updateTileColourCache();
	};

	TileRegion.prototype.getRegionColour = function(name) {
		for(var i = 0; i < this._tagColours.length; i ++) {
			if(this._tagColours[i][0] == name) {
				return this._tagColours[i][1];
			}
		}
		
		return null;
	};

	TileRegion.prototype.uncolourRegion = function(name) {
		for(var i = 0; i < this._tagColours.length; i ++) {
			if(this._tagColours[i][0] == name) {
				this._tagColours.splice(i, 1);
			}
		}
		this._updateTileColourCache();
	};



	/** Returns the width of a single tile.
	 * @return {integer} The width of a tile.
	 */
	TileRegion.prototype.tileWidth = function() {
		return this.twidth;
	};

	/** Returns the height of a single tile.
	 * @return {integer} The height of a tile.
	 */
	TileRegion.prototype.tileHeight = function() {
		return this.theight;
	};

	/** Returns the number of visible columns.
	 * @return {integer} The number of visible columns.
	 */
	TileRegion.prototype.visibleCols = function() {
		return Math.floor(this.width/this.tileWidth());
	};

	/** Returns the number of visible rows.
	 * @return {integer} The number of visible columns.
	 */
	TileRegion.prototype.visibleRows = function() {
		return Math.floor(this.height/this.tileHeight());
	};

	//width
	Object.defineProperty(TileRegion.prototype, "width", {
		get: function() {return this.cols*this.twidth;},
		set: function(value) {if(value > 0) console.warn("TileRegion setting width is not supported.");}
	});

	//height
	Object.defineProperty(TileRegion.prototype, "height", {
		get: function() {return this.rows*this.theight;},
		set: function(value) {if(value > 0) console.warn("TileRegion setting height is not supported.");}
	});

	/** Returns the map for `{@link dusk.sgui.BasicMain}` to save it.
	 * 
	 * @return {object} The current map.
	 * @since 0.0.18-alpha
	 */
	TileRegion.prototype.saveBM = function() {
		return {"rows":this.rows, "cols":this.cols};
	};

	/* Loads a map from an object. This is used by `{@link dusk.sgui.BasicMain}`.
	 * 
	 * @param {object} map The map to load, will be assigned to `{@link dusk.sgui.EditableTileMap#map}`.
	 * @since 0.0.18-alpha
	 */
	TileRegion.prototype.loadBM = function(data) {
		this.rows = data.rows;
		this.cols = data.cols;
	};

	Object.seal(TileRegion);
	Object.seal(TileRegion.prototype);

	sgui.registerType("TileRegion", TileRegion);
	
	return TileRegion;
})());
