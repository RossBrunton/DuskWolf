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
	this._inventListeners = [];
	this._caches = [];
	
	this.layerNames = layerNames?layerNames:[];
	this._extras = {};
	
	this._x = null;
	this._max = null;
	this._min = null;
	this._field = null;
	this._block = null;
	
	this._tree = new dusk.parseTree.Compiler([], [], [
		["X", (function(o) {return this._x;}).bind(this)],
		["MAX", (function(o) {return this._max;}).bind(this)],
		["MIN", (function(o) {return this._min;}).bind(this)],
		["FIELD", (function(o) {return this._field;}).bind(this)],
		["all", (function(o) {return this;}).bind(this)],
		["block", (function(o) {return this._block;}).bind(this)]
	]);
};

dusk.stats.LayeredStats.prototype.addBlock = function(layer, name, block, copy) {
	layer = this._lookupLayer(layer);
	if(copy) block = dusk.utils.clone(block);
	if(!this._layers[layer]) this._layers[layer] = {};
	if(!this._inventListeners[layer]) this._inventListeners[layer] = {};
	if(!this._caches[layer]) this._caches[layer] = {};
	
	this._layers[layer][name] = block;
	
	if("items" in dusk && block instanceof dusk.items.Invent) {
		this._inventListeners[layer][name] = block.contentsChanged.listen((function() {
			this.kick(layer);
		}).bind(this))
	}
	
	this.kick(layer);
};

dusk.stats.LayeredStats.prototype.getBlock = function(layer, name) {
	layer = this._lookupLayer(layer);
	
	return this._layers[layer][name];
};

dusk.stats.LayeredStats.prototype.removeBlock = function(layer, name) {
	layer = this._lookupLayer(layer);
	if(!this._layers[layer]) return undefined;
	
	var toReturn = this._layers[layer][name];
	this._layers[layer][name] = undefined;
	
	if("items" in dusk && toReturn instanceof dusk.items.Invent) {
		toReturn.contentsChanged.unlisten(this._inventListeners[layer][name]);
	}
	
	this.kick(layer);
	
	return toReturn;
};

dusk.stats.LayeredStats.prototype.replaceBlock = function(layer, name, block, copy) {
	this.removeBlock(layer, name);
	this.addBlock(layer, name, block, copy);
};

dusk.stats.LayeredStats.prototype.kick = function(layer) {
	layer = this._lookupLayer(layer);
	
	for(var i = layer; i < this._layers.length; i ++) {
		this._caches[i] = {};
	}
};

dusk.stats.LayeredStats.prototype.get = function(field, untilLayer) {
	var max = Infinity;
	var min = -Infinity;
	var value = null;
	untilLayer = this._lookupLayer(untilLayer);
	
	if(untilLayer < this._caches.length && field in this._caches[untilLayer]) return this._caches[untilLayer][field];
	
	for(var i = 0; i < this._layers.length && i <= untilLayer; i ++) {
		var list = [];
		
		for(var p in this._layers[i]) {
			list = this._toList(this._layers[i][p], field);
			
			for(var j = 0; j < list.length; j ++) {
				var d = list[j];
				
				if(field+"_max" in d && typeof d[field+"_max"] != "function")
					if(d[field+"_max"] > max) max = d[field+"_max"];
				if(field+"_min" in d && typeof d[field+"_max"] != "function")
					if(d[field+"_min"] > max) max = d[field+"_min"];
				if(field in d && typeof d[field] != "function") value = d[field];
				
				if(field+"_max" in d && typeof d[field+"_max"] == "function")
					if(d[field+"_max"] > max) max = d[field+"_max"](this, field, value, min, max, d);
				if(field+"_min" in d && typeof d[field+"_max"] == "function")
					if(d[field+"_min"] > max) max = d[field+"_min"](this, field, value, min, max, d);
				if(field in d && typeof d[field] == "function") value = d[field](this, field, value, min, max, d);
			}
		}
		
		for(var p in this._layers[i]) {
			list = this._toList(this._layers[i][p]);
			
			for(var j = 0; j < list.length; j ++) {
				var d = list[j];
				
				if(field+"_max_mod" in d) max = this._eval(d[field+"_max_mod"], field, value, min, max, d);
				if(field+"_min_mod" in d) min = this._eval(d[field+"_min_mod"], field, value, min, max, d);
				if(field+"_mod" in d) value = this._eval(d[field+"_mod"], field, value, min, max, d);
			}
		}
	}
	
	if(!this._caches[untilLayer]) this._caches[untilLayer] = {};
	this._caches[untilLayer][field] = value;
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
			if(field in d && typeof d[field] == "function") value = d[field](this, field, value, min, max, d);
			
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
	if("items" in dusk && value instanceof dusk.items.Invent) {
		var out = [];
		value.forEach((function(item, slot) {
			if(item.get("stats")) {
				var block = dusk.utils.clone(item.get("stats"));
				block.item = item;
				block.slot = slot;
				this.push(block);
			}
		}).bind(out));
		return out;
	}else{
		return [this._getRelevant(value, field)];
	}
};

dusk.stats.LayeredStats.prototype._eval = function(expr, field, value, min, max, block) {
	this._x = value;
	this._min = min;
	this._max = max;
	this._field = field;
	this._block = block;
	
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

dusk.stats.LayeredStats.prototype.refSave = function() {
	var out = [];
	
	for(var i = 0; i < this._layers.length; i ++) {
		out[i] = {};
		
		for(var b in this._layers[i]) {
			out[i][b] = dusk.save.saveRef(this._layers[i][b]);
		}
	}
	
	return [out, this.name, this.pack, this.layerNames];
};

dusk.stats.LayeredStats.refLoad = function(data) {
	var stats = new dusk.stats.LayeredStats(data[1], data[2], data[3]);
	var layers = data[0];
	
	for(var i = 0; i < layers.length; i ++) {
		for(var b in layers[i]) {
			stats.addBlock(i, b, dusk.save.loadRef(layers[i][b]));
		}
	}
	
	return stats;
};

dusk.stats.LayeredStats.prototype.refClass = dusk.stats.LayeredStats.refClass = function() {
	return "dusk.stats.LayeredStats";
};

dusk.stats.LayeredStats.prototype.toString = function() {
	return "[LayeredStats "+this.name+"]";
};


// ----


dusk.stats._init = function() {
	this._stats = {};
};

dusk.stats.addStats = function(name, stats, replace) {
	if(name in this._stats && !replace) {
		return;
	}
	this._stats[name] = [stats, false];
};

dusk.stats.addStatsGenerator = function(name, stats, replace) {
	if(name in this._stats && !replace) {
		return;
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

dusk.stats.save = function(type, arg) {
	if(type != "stats") return {};
	
	var out = [];
	
	if(!("names" in arg)) {
		for(var p in this._stats) {
			if(!this._stats[p][1]) {
				out.push([p, dusk.save.saveRef(this._stats[p][0])]);
			}
		}
	}else{
		for(var p in arg.names) {
			if(!this._stats[p][1]) {
				out.push([p, dusk.save.saveRef(this._stats[p][0])]);
			}
		}
	}
	
	return out;
};

dusk.stats.load = function(data, type, arg) {
	if(type != "stats") return;
	
	for(var i = 0; i < data.length; i ++) {
		this._stats[data[i][0]] = dusk.save.loadRef(data[i][1]);
	}
};

dusk.stats._init();
