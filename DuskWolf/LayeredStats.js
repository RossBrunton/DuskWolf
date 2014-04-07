//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");
dusk.load.require("dusk.parseTree");

dusk.load.provide("dusk.stats");
dusk.load.provide("dusk.stats.LayeredStats");

/** Creates a new LayeredStats instance. 
 * 
 * @class dusk.stats.LayeredStats
 * 
 * @classdesc 
 * 
 * 
 * @since 0.0.21-alpha
 * @constructor
 */
dusk.stats.LayeredStats = function(name, pack, layerNames) {
	this.name = name;
	this.pack = pack;
	
	this._layers = [];
	this.layerNames = layerNames?layerNames:[];
	this._extras = {};
	
	this._x = null;
	this._max = null;
	this._min = null;
	this._field = null;
	
	this._tree = new dusk.parseTree.Compiler([], [], [
		["X", (function(o) {return this._x;}).bind(this)],
		["MAX", (function(o) {return this._max;}).bind(this)],
		["MIN", (function(o) {return this._min;}).bind(this)],
		["FIELD", (function(o) {return this._field;}).bind(this)],
		["this", (function(o) {return this;}).bind(this)]
	]);
};

dusk.stats.LayeredStats.prototype.addBlock = function(layer, name, block, copy) {
	layer = this._lookupLayer(layer);
	if(copy) block = dusk.utils.clone(block);
	if(!this._layers[layer]) this._layers[layer] = {};
	
	this._layers[layer][name] = block;
};

dusk.stats.LayeredStats.prototype.removeBlock = function(layer, name) {
	layer = this._lookupLayer(layer);
	if(!this._layers[layer]) return undefined;
	
	var toReturn = this._layers[layer][name];
	this._layers[layer][name] = undefined;
	return toReturn;
};

dusk.stats.LayeredStats.prototype.replaceBlock = function(layer, name, block, copy) {
	layer = this._lookupLayer(layer);
	if(copy) block = dusk.utils.clone(block);
	if(!this._layers[layer]) this._layers[layer] = {};
	
	this._layers[layer][name] = block;
};

dusk.stats.LayeredStats.prototype.get = function(field, untilLayer) {
	var max = Infinity;
	var min = -Infinity;
	var value = null;
	untilLayer = this._lookupLayer(untilLayer);
	
	for(var i = 0; i < this._layers.length && i <= untilLayer; i ++) {
		var list = [];
		
		for(var p in this._layers[i]) {
			list = this._toList(this._layers[i][p], field);
			
			for(var i = 0; i < list.length; i ++) {
				var d = list[i];
				
				if(field+"_max" in d && typeof d[field+"_max"] != "function")
					if(d[field+"_max"] > max) max = d[field+"_max"];
				if(field+"_min" in d && typeof d[field+"_max"] != "function")
					if(d[field+"_min"] > max) max = d[field+"_min"];
				if(field in d && typeof d[field] != "function") value = d[field];
				
				if(field+"_max" in d && typeof d[field+"_max"] == "function")
					if(d[field+"_max"] > max) max = d[field+"_max"](this, field, value, min, max);
				if(field+"_min" in d && typeof d[field+"_max"] == "function")
					if(d[field+"_min"] > max) max = d[field+"_min"](this, field, value, min, max);
				if(field in d && typeof d[field] == "function") value = d[field](this, field, value, min, max);
			}
		}
		
		for(var p in this._layers[i]) {
			list = this._toList(this._layers[i][p]);
			
			for(var i = 0; i < list.length; i ++) {
				var d = list[i];
				
				if(field+"_max_mod" in d) max = this._eval(d[field+"_max_mod"], field, value, min, max);
				if(field+"_min_mod" in d) min = this._eval(d[field+"_min_mod"], field, value, min, max);
				if(field+"_mod" in d) value = this._eval(d[field+"_mod"], field, value, min, max);
			}
		}
	}
	
	return value;
};

dusk.stats.LayeredStats.prototype.geti = function(field, untilLayer) {
	untilLayer = this._lookupLayer(untilLayer);
	return ~~this.get(field, untilLayer);
};

dusk.stats.LayeredStats.prototype.countInLayer = function(layer) {
	layer = this._lookupLayer(layer);
	return Object.keys(this._layers[layer]).length;
};

dusk.stats.LayeredStats.prototype.getMaxInLayer = function(field, layer) {
	var max = undefined;
	layer = this._lookupLayer(layer);
	
	for(var p in this._layers[layer]) {
		list = this._toList(this._layers[layer][p]);
		
		for(var i = 0; i < list.length; i ++) {
			var d = list[i];
			
			if(field in d && typeof d[field] != "function") value = d[field];
			if(field in d && typeof d[field] == "function") value = d[field](this, field, value, min, max);
			
			if(value > max[1] || max === undefined) max = [p, value];
		}
	}
	
	return max;
};

dusk.stats.LayeredStats.prototype.getMinInLayer = function(layer, field) {
	var min = undefined;
	layer = this._lookupLayer(layer);
	
	for(var p in this._layers[layer]) {
		list = this._toList(this._layers[layer][p]);
		
		for(var i = 0; i < list.length; i ++) {
			var d = list[i];
			
			if(field in d && typeof d[field] != "function") value = d[field];
			if(field in d && typeof d[field] == "function") value = d[field](this, field, value, min, max);
			
			if(value < min[1] || min === undefined) min = [p, value];
		}
	}
	
	return min;
};

dusk.stats.LayeredStats.prototype._toList = function(value, field) {
	if("items" in dusk && object instanceof dusk.Inheritable && object.type == dusk.items.items) {
		
	}else{
		return [this._getRelevant(value, field)];
	}
};

dusk.stats.LayeredStats.prototype._eval = function(expr, field, value, min, max) {
	this._x = value;
	this._min = min;
	this._max = max;
	this._field = field;
	
	return this._tree.compile(expr).eval();
};

dusk.stats.LayeredStats.prototype._lookupLayer = function(layer) {
	if(!isNaN(layer)) return layer;
	
	for(var i = 0; i < this.layerNames; i ++) {
		if(this.layerNames[i] == layer) return i;
	}
	
	if(!layer) return 0xffffffff;
	
	console.log("Unknown layer "+layer);
	return undefined;
};

dusk.stats.LayeredStats.prototype.tickDown = function(field) {
	for(var i = 0; i < this._layers.length; i ++) {
		for(var p in this._layers[i]) {
			var d = this._getRelevant(this._layers[i][p]);
			if(field in d) {
				d[field] --;
				if(d[field] <= 0) {
					this.removeBlock(i, p);
				}
			}
		}
	}
}

dusk.stats.LayeredStats.prototype._getRelevant = function(object, field) {
	var out = {};
	
	if(!object) return {};
	
	if("get" in object && typeof object.get == "function") {
		if(object.get(field) !== undefined) out[field] = object.get(field);
		if(object.get(field+"_max") !== undefined) out[field+"_max"] = object.get(field+"_max");
		if(object.get(field+"_min") !== undefined) out[field+"_min"] = object.get(field+"_min");
		if(object.get(field+"_mod") !== undefined) out[field+"_mod"] = object.get(field+"_mod");
		if(object.get(field+"_max_mod") !== undefined) out[field+"_max_mod"] = object.get(field+"_max_mod");
		if(object.get(field+"_min_mod") !== undefined) out[field+"_min_mod"] = object.get(field+"_min_mod");
	}else{
		return object;
	}
	
	return out;
};

dusk.stats.LayeredStats.prototype.getExtra = function(name) {
	if(!(name in this._extras)) return null;
	return this._extras[name];
};

dusk.stats.LayeredStats.prototype.setExtra = function(name, object) {
	this._extras[name] = object;
};

dusk.stats.LayeredStats.prototype.toString = function() {
	return "[LayeredStats "+this.name+"]";
};


// ----


dusk.stats._init = function() {
	this._stats = {};
};

dusk.stats.addStats = function(name, stats, noWarn) {
	if(name in this._stats && !noWarn) {
		console.warn("You are replacing the stats "+name+"! Be carefull!");
	}
	this._stats[name] = [stats, false];
};

dusk.stats.addStatsGenerator = function(name, stats, noWarn) {
	if(name in this._stats && !noWarn) {
		console.warn("You are replacing the stats generator "+name+"! Be carefull!");
	}
	this._stats[name] = [stats, true];
};

dusk.stats.getStats = function(name) {
	if(!this._stats[name]) return null;
	if(this._stats[name][1]) {
		return this._stats[name][0]();
	}
	return this._stats[name][0];
};

dusk.stats._init();
