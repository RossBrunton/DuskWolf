//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.TileRegion", (function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var c = load.require("dusk.sgui.c");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	
	var TileRegion = function(tileMap, generator, parent) {
		this._tileMap = tileMap;
		this._tiles = [null];
		this._entities = [];
		this._map = new Uint16Array(tileMap.rows * tileMap.cols);
		this._originX = 0;
		this._originY = 0;
		this._childRegions = {};
		this._generator = generator;
		this._parent = parent;
		
		this.colour = "";
		this.name = "";
		
		this.onChange = new EventDispatcher("dusk.tiles.sgui.TileRegion.onChange");
	};
	
	TileRegion.prototype.setOrigin = function(x, y) {
		this._originX = x;
		this._originY = y;
	};
	
	TileRegion.prototype.clear = function() {
		this._tiles = [null];
		this._entities = [];
		this._map = new Uint16Array(this._tileMap.rows * this._tileMap.cols);
		this._childRegions = {};
		
		this.onChange.fire();
	};
	
	TileRegion.prototype.add = function(x, y, px, py, weight, e, dist, evenEnt, childObj) {
		this._tiles.push([x, y, px, py, weight, e, dist, childObj]);
		this._map[(y * this._tileMap.cols)+x] = this._tiles.length-1;
		if(evenEnt && e) this._entities.push([e, this._tiles.length-1]);
		
		this.onChange.fire();
	};
	
	TileRegion.prototype.copyAllInto = function(region) {
		for(var i = 1; i < this._tiles.length; i ++) {
			region.add(this._tiles[i][0], this._tiles[i][1],
				this._tiles[i][2], this._tiles[i][3], this._tiles[i][4],
				this._tiles[i][5], this._tiles[i][3], this._tiles[i][6],
				true, this._tiles[i][7]
			);
		}
	};
	
	TileRegion.prototype.get = function(x, y) {
		return this._tiles[this._map[(y * this._tileMap.cols) + x]];
	};
	
	TileRegion.prototype.getAll = function(x, y) {
		var out = [];
		
		for(var i = 0; i < this._tiles.length; i ++) {
			if(this._tiles[i] && this._tiles[i][0] == x && this._tiles[i][1] == y) {
				out.push(this._tiles[i]);
			}
		}
		
		return out;
	};
	
	TileRegion.prototype.getEvery = function() {
		return this._tiles;
	};
	
	TileRegion.prototype.getChild = function(child) {
		return this._childRegions[child];
	};
	
	TileRegion.prototype.lookup = function(id) {
		return this._tiles[id];
	};
	
	TileRegion.prototype.isIn = function(x, y) {
		return this._map[(y * this._tileMap.cols) + x] != 0;
	};
	
	TileRegion.prototype.entities = function() {
		return this._entities;
	};
	
	TileRegion.prototype.pathTo = function(x, y) {
		var o = [];
		var t = this.get(x, y);
		
		while(t && t[2] >= 0) {
			o.push(_resolveDirection(t[2], t[3], t[0], t[1]));
			t = this.get(t[2], t[3]);
		}
		
		return o.reverse();
	};
	
	TileRegion.prototype.followPath = function(path) {
		var o = [-1, -1];
		var t = [this._originX, this._originY];
		var p = 0;
		
		while(p <= path.length) {
			o[0] = t[0];
			o[1] = t[1];
			t = _goDirection(t[0], t[1], path[p]);
			p ++;
		}
		
		return o;
	};
	
	TileRegion.prototype.followPathInto = function(path, dest) {
		var o = [-1, -1];
		var t = [this._originX, this._originY];
		var p = 0;
		
		while(p <= path.length) {
			dest.add(t[0], t[1], o[0], o[1], undefined, undefined, p, undefined);
			o[0] = t[0];
			o[1] = t[1];
			t = _goDirection(t[0], t[1], path[p]);
			p ++;
		}
	};
	
	TileRegion.prototype.expandRegion = function(x, y, range, opts) {
		var s = this._tileMap;
		
		var w = 0;
		var o = this._tileMap.container.getPrimaryEntityLayer().getEntitiesExactlyHere(
			x*this._tileMap.tileWidth(), y*this._tileMap.tileHeight(), undefined, true
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
		
		var cloud = [[x, y, -1, -1, w, e, 0, {}]];
		
		this.setOrigin(x, y);
		
		if("weights" in opts) s.weights = opts.weights;
		while(true) {
			var cl = _getMinFromCloud(cloud);
			if(cl[4] == 0xffffffff) break;
			
			var t = s.getTile(cl[0], cl[1]);
			
			if(/*!this.isInRegion(name, c[0], c[1])*/ true) {
				if(!("entBlock" in opts) || !cl[5] || !cl[5].evalTrigger(opts.entBlock)) {
					if(!opts.los || this.checkLOS(x, y, cl[0], cl[1])) {
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
						
						if(!this.isIn(cl[0], cl[1]) && (!opts.min || cl[4] > opts.min)) {
							if((!("minWeight" in opts) || cl[4] >= opts.minWeight)
							&& (!("rangeMap" in opts) || opts.rangeMap[cl[4]])) {
								
								if("forEach" in opts) {
									for(var i = 0; i < opts.forEach.length; i ++) {
										var e = opts.forEach[i];
										
										cl[7][e.name] = new TileRegion(this._tileMap, this._generator, this);
										cl[7][e.name].colour = e.colour;
										cl[7][e.name].name = e.name;
										cl[7][e.name].expandRegion(cl[0], cl[1], e.range, e);
										
										if(!(e.name in this._childRegions))
											this._childRegions[e.name] = 
												new TileRegion(this._tileMap, this._generator, this);
											this._childRegions[e.name].colour = e.colour;
											this._childRegions[e.name].name = e.name;
										
										cl[7][e.name].copyAllInto(this._childRegions[e.name]);
									}
								}
								
								if(!("entFilter" in opts) || !cl[5]) {
									this.add(cl[0], cl[1], cl[2], cl[3], cl[4], cl[5], cl[6], true, cl[7]);
								}else{
									this.add(
										cl[0], cl[1], cl[2], cl[3], cl[4], cl[5], cl[6],
										cl[5].evalTrigger(opts.entFilter), cl[7]
									);
								}
							}
						}
					}
				}
				
				cl[4] = 0xffffffff;
			}
			
			TileMap.tileData.free(t);
		}
		
		if(opts.forEach) {
			for(var i = 0; i < opts.forEach.length; i ++) {
				var e = opts.forEach[i];
				
				//if(e.colour) {
				//	this._generator.colourRegion(this, e.colour, e.name);
				//}
			}
		}
		
		this.colour = opts.colour;
	};
	
	var _isInCloud = function(cloud, c, tile) {
		if(c[0] == tile[2] && c[1] == tile[3]) return c;
		
		for(var i = 0; i < cloud.length; i ++) {
			if(cloud[i][0] == tile[2] && cloud[i][1] == tile[3]) return cloud[i];
		}
		
		return null;
	};
	
	TileRegion.prototype._updateCloud = function(cloud, oldTile, newTile, range) {
		var exists = _isInCloud(cloud, oldTile, newTile);
		if(exists && exists[4] == 0xffffffff) return;
		
		var e = null;
		var w = 0;
		
		if(!exists) {
			var o = this._tileMap.container.getPrimaryEntityLayer().getEntitiesExactlyHere(
				newTile[2]*this._tileMap.tileWidth(), newTile[3]*this._tileMap.tileHeight(), undefined, true
			);
			
			var i = 0;
			while(i < o.length) {
				if(!o[i].eProp("noRegion")) {
					e = o[0];
					w = _entityWeight(e);
					break;
				}
				
				i ++;
			}
		}else{
			if(exists[5]) {
				e = exists[5];
				w = _entityWeight(e);
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
				[newTile[2], newTile[3], oldTile[0], oldTile[1], oldTile[4]+newTile[4]+w, e, oldTile[6]+1, {}]
			);
		}
	};
	
	var _entityWeight = function(e) {
		if(!e || !e.eProp("regionWeight")) {
			return 0;
		}
		
		return e.eProp("regionWeight");
	};
	
	var _getMinFromCloud = function(cloud) {
		var min = 0;
		for(var i = 1; i < cloud.length; i ++) {
			if(cloud[i][4] < cloud[min][4]) {
				min = i;
			}
		}
		
		var toRet = cloud[min];
		return toRet;
	};
	
	TileRegion.prototype.checkLOS = function(xa, ya, xb, yb) {
		function abs(a) {return a > 0 ? a : -a;}

		var dx = abs(xb - xa);
		var dy = abs(yb - ya);
		
		var sx = -1;
		var sy = -1;
		
		if(xa < xb) sx = 1;
		if(ya < yb) sy = 1;
		
		var err = dx - dy;
		
		var s = this._tileMap;
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
	var _resolveDirection = function(xa, ya, xb, yb) {
		if(xa == xb + 1) return c.DIR_LEFT;
		if(xa == xb - 1) return c.DIR_RIGHT;
		if(ya == yb + 1) return c.DIR_UP;
		if(ya == yb - 1) return c.DIR_DOWN;
	};
	
	var _goDirection = function(x, y, dir) {
		switch(dir) {
			case c.DIR_LEFT: return [x-1, y];
			case c.DIR_RIGHT: return [x+1, y];
			case c.DIR_UP: return [x, y-1];
			case c.DIR_DOWN: return [x, y+1];
		}
	};
	
	return TileRegion;
})());

load.provide("dusk.tiles.sgui.TileRegionGenerator", (function() {
	var Component = load.require("dusk.sgui.Component");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var TileRegion = load.require("dusk.tiles.sgui.TileRegion");

	/** @class dusk.tiles.sgui.TileRegionGenerator
	 * 
	 * @classdesc A tile region serves to group tiles, and can colour them.
	 * 
	 * Generally, a region represents a grid of identical sized tiles. Each tile can be in a number of regions, and
	 * contain basic pathing information on how to get from a "starting point". Regions can also have all the tiles in 
	 * them coloured, as well.
	 * 
	 * Tiles can be added to regions individually, but it is more usefull to use
	 *  `{@link dusk.tiles.sgui.TileRegionGenerator#expandRegion}` to create a region that, essentially, says "Every
	 *  tile that is n tiles away from a given tile". If you use `expandRegion`, you get paths to and from the "origin"
	 *  tile for free.
	 * 
	 * @extends dusk.sgui.Component
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var TileRegionGenerator = function (parent, name) {
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
		
		/** The number of rows in this TileRegionGenerator.
		 * @type integer
		 * @default 50
		 */
		this.rows = 50;
		/** The number of columns in this TileRegionGenerator.
		 * @type integer
		 * @default 50
		 */
		this.cols = 50;
		
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
		this._mapper.map("rows", "rows");
		this._mapper.map("cols", "cols");
		
		this._mapper.map("theight", "theight");
		this._mapper.map("twidth", "twidth");
		
		//Listeners
		this.prepareDraw.listen(this._tileRegionDraw.bind(this));
	};
	TileRegionGenerator.prototype = Object.create(Component.prototype);
	
	/** Returns the location of the source tile on the origin image
	 *  (as in, the one that was drawn to here) that the specified coordinate is in.
	 * 
	 * Please return the output to `{@link dusk.tiles.sgui.TileRegionGenerator.tileData}` when you are done.
	 * @param {integer} x The x coordinate to look in.
	 * @param {integer} y The y coordinate to look in.
	 * @param {boolean=false} exactX If true
	 *  then the specified x coordinate must exactly match the x coordinate of a tile on this map.
	 * @param {boolean=false} exactY If true
	 *  then the specified y coordinate must exactly match the y coordinate of a tile on this map.
	 * @return {?array} An `[x,y]` array specifying the tile that is here, or `null`, if there is no tile here.
	 */
	TileRegionGenerator.prototype.tilePointIn = function(x, y, exactX, exactY) {
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
	
	TileRegionGenerator.prototype._updateTileColourCache = function() {
		this._needsCacheUpdating = true;
	};
	
	/** Used internally to draw the tilemap.
	 * @param {object} e A `prepareDraw` event object.
	 * @private
	 */
	TileRegionGenerator.prototype._tileRegionDraw = function(e) {
		//Update the colour cache if needed
		if(this._needsCacheUpdating) {
			this._cachedTileColours = [];
			
			//Loop through all regions
			for(var i = 0; i < this._tagColours.length; i ++) {
				var t = [this._tagColours[i][0], this._tagColours[i][0].colour];
				var r = t[0].getEvery();
				
				if(r) {
					//Loop through every tile (r is region, t is pair [regionName, regionColour])
					for(var j = 1; j < r.length; j ++) {
						var set = false;
						
						var add = 0;
						
						//Arrows go over the top of everything
						if(t[1].charAt(0) != ":") {
							for(var k = 0; k < this._cachedTileColours.length; k ++) {
								if(this._cachedTileColours[k][0] == r[j][0]&&this._cachedTileColours[k][1] == r[j][1]) {
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
			
			if((c[0]+1) * this.tileWidth() < e.d.slice.x
			|| c[0] * this.tileWidth() > e.d.slice.x + e.d.width
			|| (c[1]+1) * this.tileHeight() < e.d.slice.y
			|| c[1] * this.tileHeight() > e.d.slice.y + e.d.height) {
				continue;
			}
			
			if(c[2].charAt(0) != ":") {
				e.c.fillStyle = c[2];
				e.c.fillRect(
					e.d.dest.x + ((c[0] * this.tileWidth()) - e.d.slice.x) + 1,
					e.d.dest.y + ((c[1] * this.tileHeight()) - e.d.slice.y) + 1,
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
						
						e.d.dest.x + ((c[0] * this.tileWidth()) - e.d.slice.x),
						e.d.dest.y + ((c[1] * this.tileHeight()) - e.d.slice.y),
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
	
	TileRegionGenerator.prototype._arrowSide = function(now, region, x, y) {
		var rel = region.getAll(x, y);
		
		if(!rel.length) return false;
		
		for(var i = 0; i < rel.length; i ++) {
			if(rel[i][6] == now[6] + 1) return true;
			if(rel[i][6] == now[6] - 1) return true;
		}
		
		return false;
	};
	
	TileRegionGenerator.prototype._getArrow = function(init, left, right, up, down) {
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
	
	TileRegionGenerator.prototype.generateRegion = function(x, y, range, opts) {
		var region = new TileRegion(this.container.getScheme(), this);
		if("name" in opts) region.name = opts.name;
		
		return new Promise(function(fulfill, reject) {
			region.expandRegion(x, y, range, opts);
			
			fulfill(region);
		});
	};
	
	
	TileRegionGenerator.prototype.colourRegion = function(region, path) {
		var fullpath = region.name + "." + path;
		if(!path) fullpath = region.name;
		
		var parent = region;
		if(path) {
			var frags = path.split(".");
			for(var p = 0; p < frags.length; p ++) {
				region = region.getChild(frags[p]);
			}
		}
		
		this._tagColours.push(
			[region, fullpath, region.onChange.listen(this._updateTileColourCache.bind(this)), parent]
		);
		this._updateTileColourCache();
	};
	
	TileRegionGenerator.prototype.uncolourRegion = function(region, path) {
		var fullpath = region.name + "." + path;
		if(!path) fullpath = region.name;
		
		for(var i = 0; i < this._tagColours.length; i ++) {
			if(this._tagColours[i][1] == fullpath) {
				this._tagColours[i][0].onChange.unlisten(this._tagColours[i][2]);
				this._tagColours.splice(i, 1);
				i --;
			}
		}
		this._updateTileColourCache();
	};
	
	TileRegionGenerator.prototype.getRegionColour = function(region) {
		for(var i = 0; i < this._tagColours.length; i ++) {
			if(this._tagColours[i][0] == region) {
				return this._tagColours[i][0].colour;
			}
		}
		
		return null;
	};
	
	
	/** Returns the width of a single tile.
	 * @return {integer} The width of a tile.
	 */
	TileRegionGenerator.prototype.tileWidth = function() {
		return this.twidth;
	};
	
	/** Returns the height of a single tile.
	 * @return {integer} The height of a tile.
	 */
	TileRegionGenerator.prototype.tileHeight = function() {
		return this.theight;
	};
	
	/** Returns the number of visible columns.
	 * @return {integer} The number of visible columns.
	 */
	TileRegionGenerator.prototype.visibleCols = function() {
		return Math.floor(this.width/this.tileWidth());
	};
	
	/** Returns the number of visible rows.
	 * @return {integer} The number of visible columns.
	 */
	TileRegionGenerator.prototype.visibleRows = function() {
		return Math.floor(this.height/this.tileHeight());
	};
	
	//width
	Object.defineProperty(TileRegionGenerator.prototype, "width", {
		get: function() {return this.cols*this.twidth;},
		set: function(value) {if(value > 0) console.warn("TileRegionGenerator setting width is not supported.");}
	});
	
	//height
	Object.defineProperty(TileRegionGenerator.prototype, "height", {
		get: function() {return this.rows*this.theight;},
		set: function(value) {if(value > 0) console.warn("TileRegionGenerator setting height is not supported.");}
	});
	
	/** Returns the map for `{@link dusk.rooms.sgui.LayeredRoom}` to save it.
	 * 
	 * @return {object} The current map.
	 * @since 0.0.18-alpha
	 */
	TileRegionGenerator.prototype.saveBM = function() {
		return {"rows":this.rows, "cols":this.cols};
	};
	
	/* Loads a map from an object. This is used by `{@link dusk.rooms.sgui.LayeredRoom}`.
	 * 
	 * @param {object} map The map to load, will be assigned to `{@link dusk.tiles.sgui.EditableTileMap#map}`.
	 * @since 0.0.18-alpha
	 */
	TileRegionGenerator.prototype.loadBM = function(data) {
		this.rows = data.rows;
		this.cols = data.cols;
	};
	
	sgui.registerType("TileRegionGenerator", TileRegionGenerator);
	
	return TileRegionGenerator;
})());
