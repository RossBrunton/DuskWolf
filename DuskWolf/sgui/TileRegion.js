//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.data");
dusk.load.require("dusk.utils");

dusk.load.provide("dusk.sgui.TileRegion");

/* @class dusk.sgui.TileRegion
 * 
 * @classdesc This is a lot of tiles arranged in a grid.
 * 
 * This can be thought of as a lot of `{@link dusk.sgui.Tile}` instances arranged in a grid,
 *  but for practical reasons this is not how it is implemented.
 * 
 * Each tile on the grid has a coordinate, where the tile at the upper left is at (0, 0),
 *  and the next one to the right is (1, 0) and so on.
 * 
 * The tilemap must be drawn completley before it can be used, hence changing any tile
 *  and especially changing the dimensions of the tilemap is a really expensive operation.
 *
 * Only part of the tilemap is visible, as described by the `*bound` properties, and this will be the only area drawn.
 * 
 * Some functions accept and return tileData objects. This is essentially an array, the first two elements are the x and
 *  y coordinates of the image displayed (from the original stylesheet), the second two are the x and y coordinates that
 *  this tiledata describes, and the last element is the weight of this tile if appropriate.
 * 
 * @extends dusk.sgui.Component
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @constructor
 */
dusk.sgui.TileRegion = function (parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	/** The width (for displaying) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 32
	 */
	this.twidth = 32;
	/** The height (for displaying) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 32
	 */
	this.theight = 32;
	
	/** The width (for reading from the image) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 16
	 */
	this.swidth = 16;
	/** The height (for reading from the image) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 16
	 */
	this.sheight = 16;

	
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
	
	this._regions = {};
	
	this._tagColours = [];
	
	this._cachedTileColours = [];
	
	//Prop masks
	this._registerPropMask("rows", "rows");
	this._registerPropMask("cols", "cols");
	
	this._registerPropMask("sheight", "sheight");
	this._registerPropMask("swidth", "swidth");
	
	this._registerPropMask("theight", "theight");
	this._registerPropMask("twidth", "twidth");
	
	//Listeners
	this.prepareDraw.listen(this._tileRegionDraw, this);
	this.frame.listen(this._tileRegionFrame, this);
	
	window.hook = this;
};
dusk.sgui.TileRegion.prototype = Object.create(dusk.sgui.Component.prototype);

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
dusk.sgui.TileRegion.prototype.tilePointIn = function(x, y, exactX, exactY) {
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
dusk.sgui.TileRegion.prototype._tileRegionFrame = function(e) {
	
};

/** Used internally to draw the tilemap.
 * @param {object} e A `prepareDraw` event object.
 * @private
 */
dusk.sgui.TileRegion.prototype._tileRegionDraw = function(e) {
	for(var i = 0; i < this._cachedTileColours.length; i ++) {
		var c = this._cachedTileColours[i];
		
		var hscale = this.swidth/this.twidth;
		var vscale = this.sheight/this.theight;
		
		if((c[0]+1) * hscale * this.tileWidth() < e.d.sourceX
		|| c[0] * hscale * this.tileWidth() > e.d.sourceX + e.d.width
		|| (c[1]+1) * vscale * this.tileHeight() < e.d.sourceY
		|| c[1] * vscale * this.tileHeight() > e.d.sourceY + e.d.height) {
			continue;
		}
		
		e.c.fillStyle = c[2];
		e.c.fillRect(
			e.d.destX + ((c[0] * hscale * this.tileWidth()) - e.d.sourceX) + 1,
			e.d.destY + ((c[1] * vscale * this.tileHeight()) - e.d.sourceY) + 1,
			hscale * this.tileWidth() - 2, vscale * this.tileHeight() - 2
		);
	}
};

dusk.sgui.TileRegion.prototype.clearRegion = function(name) {
	this._regions[name] = undefined;
	
	this._updateTileColourCache();
};

dusk.sgui.TileRegion.prototype.addToRegion = function(name, x, y, px, py, weight, e, dist) {
	if(!(name in this._regions) || !this._regions[name]) this._regions[name] = [];
	
	this._regions[name].push([x, y, px, py, weight, e, dist]);
	this._updateTileColourCache();
};

dusk.sgui.TileRegion.prototype.getFromRegion = function(name, x, y) {
	if(!(name in this._regions) || !this._regions[name]) this._regions[name] = [];
	
	for(var i = 0; i < this._regions[name].length; i ++) {
		if(this._regions[name][i][0] == x && this._regions[name][i][1] == y) {
			return this._regions[name][i];
		}
	}
	
	return null;
};

dusk.sgui.TileRegion.prototype.isInRegion = function(name, x, y) {
	if(!(name in this._regions) || !this._regions[name]) return false;
	
	for(var i = 0; i < this._regions[name].length; i ++) {
		if(this._regions[name][i][0] == x && this._regions[name][i][1] == y) {
			return true;
		}
	}
	
	return false;
};

dusk.sgui.TileRegion.prototype.getRegion = function(name) {
	return this._regions[name];
};

dusk.sgui.TileRegion.prototype.pathTo = function(name, x, y) {
	var o = [];
	var t = this.getFromRegion(name, x, y);
	
	while(t[2] >= 0) {
		o.push(this._resolveDirection(t[2], t[3], t[0], t[1]));
		t = this.getFromRegion(name, t[2], t[3]);
	}
	
	return o;
};

dusk.sgui.TileRegion.prototype.expandRegion = function(name, x, y, range, los, ignoreFirst) {
	var s = this.container.getScheme();
	
	var w = 0;
	
	if(!ignoreFirst) {
		var o = this.container.getPrimaryEntityLayer().getEntitiesHere(
			x*this.tileWidth(), y*this.tileHeight(), undefined, true
		);
		
		var e = null;
		if(o.length > 0) {
			e = o[0];
		}
		
		w = this._entityWeight(e);
	}
	
	var t = s.getTile(x, y);
	var cloud = [[x, y, -1, -1, w]];
	dusk.sgui.TileMap.tileData.free(t);
	
	while(cloud.length) {
		var c = this._getMinFromCloud(cloud);
		var t = s.getTile(c[0], c[1]);
		
		if(!los || this.checkLOS(name, x, y, c[0], c[1])) {
			s.shiftTile(t, dusk.sgui.c.DIR_UP);
			this._updateCloud(cloud, c, t, range);
			s.shiftTile(t, dusk.sgui.c.DIR_DOWN);
		
			s.shiftTile(t, dusk.sgui.c.DIR_RIGHT);
			this._updateCloud(cloud, c, t, range);
			s.shiftTile(t, dusk.sgui.c.DIR_LEFT);
		
			s.shiftTile(t, dusk.sgui.c.DIR_DOWN);
			this._updateCloud(cloud, c, t, range);
			s.shiftTile(t, dusk.sgui.c.DIR_UP);
		
			s.shiftTile(t, dusk.sgui.c.DIR_LEFT);
			this._updateCloud(cloud, c, t, range);
			
			this.addToRegion(name, c[0], c[1], c[2], c[3], c[4], c[5], c[6]);
		}
		
		dusk.sgui.TileMap.tileData.free(t);
	}
};

dusk.sgui.TileRegion.prototype._isInCloud = function(cloud, c, tile) {
	if(c[0] == tile[2] && c[1] == tile[3]) return c;
	
	for(var i = 0; i < cloud.length; i ++) {
		if(cloud[i][0] == tile[2] && cloud[i][1] == tile[3]) return cloud[i];
	}
	
	return null;
};

dusk.sgui.TileRegion.prototype._updateCloud = function(cloud, oldTile, newTile, range) {
	var exists = this._isInCloud(cloud, oldTile, newTile);
	
	var o = this.container.getPrimaryEntityLayer().getEntitiesHere(
		newTile[2]*this.tileWidth(), newTile[3]*this.tileHeight(), undefined, true
	);
	
	var e = null;
	if(o.length > 0) {
		e = o[0];
	}
	
	if(oldTile[4] + newTile[4] + this._entityWeight(e) > range) return;
	
	if(exists) {
		if(oldTile[4] + newTile[4] + this._entityWeight(e) < exists[4]) {
			exists[2] = oldTile[0];
			exists[3] = oldTile[1];
			exists[4] = oldTile[4] + newTile[4] + this._entityWeight(e);
			exists[6] = oldTile[6] + 1;
		}
	}else{
		cloud.push(
			[newTile[2], newTile[3], oldTile[0], oldTile[1], oldTile[4]+newTile[4]+this._entityWeight(e), oldTile[6]+1]
		);
	}
};

dusk.sgui.TileRegion.prototype._entityWeight = function(e) {
	if(!e || !e.eProp("regionWeight")) {
		return 0;
	}
	
	return e.eProp("regionWeight");
};

dusk.sgui.TileRegion.prototype._getMinFromCloud = function(cloud, pop) {
	var min = 0;
	for(var i = 1; i < cloud.length; i ++) {
		if(cloud[i][4] < cloud[min][4]) {
			min = i;
		}
	}
	
	var toRet = cloud[min];
	cloud.splice(min, 1);
	return toRet;
};


dusk.sgui.TileRegion.prototype._updateTileColourCache = function() {
	this._cachedTileColours = [];
	
	for(var i = 0; i < this._tagColours.length; i ++) {
		var t = this._tagColours[i];
		var r = this.getRegion(t[0]);
		
		if(r) {
			for(var j = 0; j < r.length; j ++) {
				var set = false;
				
				for(var k = 0; k < this._cachedTileColours.length; k ++) {
					if(this._cachedTileColours[k][0] == r[j][0] && this._cachedTileColours[k][1] == r[j][1]) {
						set = true;
						this._cachedTileColours[k][2] = t[1];
					}
				}
				
				if(!set) {
					this._cachedTileColours.push([r[j][0], r[j][1], t[1]]);
				}
			}
		}
	}
};

dusk.sgui.TileRegion.prototype.checkLOS = function(name, xa, ya, xb, yb) {
	function abs(a) {return a > 0 ? a : -a;}

	var dx = abs(xb - xa);
	var dy = abs(yb - ya);
	
	var sx = -1;
	var sy = -1;
	
	if(xa < xb) sx = 1;
	if(ya < yb) sy = 1;
	
	var err = dx - dy;

	while(true) {
		var s = this.container.getScheme();
		var t = s.getTile(xa, ya);
		if(t[4] >= 100) {
			dusk.sgui.TileMap.tileData.free(t);
			return false;
		}
		dusk.sgui.TileMap.tileData.free(t);
		
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
dusk.sgui.TileRegion.prototype._resolveDirection = function(xa, ya, xb, yb) {
	if(xa == xb + 1) return dusk.sgui.c.DIR_LEFT;
	if(xa == xb - 1) return dusk.sgui.c.DIR_RIGHT;
	if(ya == yb + 1) return dusk.sgui.c.DIR_UP;
	if(ya == yb - 1) return dusk.sgui.c.DIR_DOWN;
};

dusk.sgui.TileRegion.prototype.colourRegion = function(name, colour) {
	this._tagColours.push([name, colour]);
	this._updateTileColourCache();
};

dusk.sgui.TileRegion.prototype.uncolourRegion = function(name) {
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
dusk.sgui.TileRegion.prototype.tileWidth = function() {
	return this.twidth;
};

/** Returns the height of a single tile.
 * @return {integer} The height of a tile.
 */
dusk.sgui.TileRegion.prototype.tileHeight = function() {
	return this.theight;
};

/** Returns the number of visible columns.
 * @return {integer} The number of visible columns.
 */
dusk.sgui.TileRegion.prototype.visibleCols = function() {
	return Math.floor(this.width/this.tileWidth());
};

/** Returns the number of visible rows.
 * @return {integer} The number of visible columns.
 */
dusk.sgui.TileRegion.prototype.visibleRows = function() {
	return Math.floor(this.height/this.tileHeight());
};

//width
Object.defineProperty(dusk.sgui.TileRegion.prototype, "width", {
	get: function() {
		return this.cols*this.twidth;
	},

	set: function(value) {if(value > 0) console.warn("TileRegion setting width is not supported.");}
});

//height
Object.defineProperty(dusk.sgui.TileRegion.prototype, "height", {
	get: function() {
		return this.rows*this.theight;
	},

	set: function(value) {if(value > 0) console.warn("TileRegion setting height is not supported.");}
});

/** Returns the map for `{@link dusk.sgui.BasicMain}` to save it.
 * 
 * @return {object} The current map.
 * @since 0.0.18-alpha
 */
dusk.sgui.TileRegion.prototype.saveBM = function() {
	return {"rows":this.rows, "cols":this.cols};
};

/* Loads a map from an object. This is used by `{@link dusk.sgui.BasicMain}`.
 * 
 * @param {object} map The map to load, will be assigned to `{@link dusk.sgui.EditableTileMap#map}`.
 * @since 0.0.18-alpha
 */
dusk.sgui.TileRegion.prototype.loadBM = function(data) {
	this.rows = data.rows;
	this.cols = data.cols;
};

Object.seal(dusk.sgui.TileRegion);
Object.seal(dusk.sgui.TileRegion.prototype);

dusk.sgui.registerType("TileRegion", dusk.sgui.TileRegion);
