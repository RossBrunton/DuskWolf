//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.Properties", function() {
	var utils = load.require("dusk.utils");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	
	var Properties = function(tilemap) {
		this._tilemap = tilemap ? tilemap : null;
		
		this._map = new Map();
	};
	
	Properties.prototype.get = function(x, y, width, height) {
		if(!this._tilemap) throw new TypeError("Properties object has no tilemap");
		if(width === undefined) width = 1;
		if(height === undefined) height = 1;
		
		x = ~~(x / width);
		y = ~~(y / height);
		
		var tmd = this._tilemap.getTile(x, y);
		var p = tmd[1] * 100 + tmd[0];
		
		var toRet;
		if(!this._map.has(p)) {
			toRet = [];
		}else{
			toRet = this._map.get(p);
		}
		
		TileMap.tileData.free(tmd);
		return toRet;
	};
	
	Properties.prototype.has = function(x, y, prop, width, height) {
		return this.get(x, y, width, height).includes(prop);
	};
	
	Properties.prototype.add = function(ox, oy, prop) {
		var p = oy * 100 + ox;
		
		if(!this._map.has(p)) {
			this._map.set(p, []);
		}
		
		this._map.get(p).push(prop);
	};
	
	Properties.prototype.associate = function(tilemap) {
		this._tilemap = tilemap;
	};
	
	Properties.prototype.toString = function() {
		return "[Properties]";
	};
	
	return Properties;
});
