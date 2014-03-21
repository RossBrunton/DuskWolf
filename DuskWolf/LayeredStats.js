//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");
dusk.load.require("dusk.parseTree");

dusk.load.provide("dusk.LayeredStats");

/** Creates a new LayeredStats instance. 
 * 
 * @class dusk.LayeredStats
 * 
 * @classdesc 
 * 
 * 
 * @since 0.0.21-alpha
 * @constructor
 */
dusk.LayeredStats = function(name) {
	this.name = name;
	
	this._layers = [];
	
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

dusk.LayeredStats.prototype.addBlock = function(layer, name, block, copy) {
	if(copy) block = dusk.utils.clone(block);
	if(!this._layers[layer]) this._layers[layer] = {};
	
	this._layers[layer][name] = block;
};

dusk.LayeredStats.prototype.removeBlock = function(layer, name) {
	if(!this._layers[layer]) return undefined;
	
	var toReturn = this._layers[layer][name];
	this._layers[layer][name] = undefined;
	return toReturn;
};

dusk.LayeredStats.prototype.replaceBlock = function(layer, name, block, copy) {
	if(copy) block = dusk.utils.clone(block);
	if(!this._layers[layer]) this._layers[layer] = {};
	
	this._layers[layer][name] = block;
};

dusk.LayeredStats.prototype.get = function(untilLayer, field) {
	var max = Infinity;
	var min = -Infinity;
	var value = null;
	
	for(var i = 0; i < this._layers.length && i <= untilLayer; i ++) {
		var list = [];
		
		for(var p in this._layers[i]) {
			list = this._toList(this._layers[i][p]);
			
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

dusk.LayeredStats.prototype.geti = function(untilLayer, field) {
	return ~~this.get(untilLayer, field);
};

dusk.LayeredStats.prototype.countInLayer = function(layer) {
	return Object.keys(this._layers[layer]).length;
};

dusk.LayeredStats.prototype.getMaxInLayer = function(layer, field) {
	var max = undefined;
	
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

dusk.LayeredStats.prototype.getMinInLayer = function(layer, field) {
	var min = undefined;
	
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

dusk.LayeredStats.prototype._toList = function(value) {
	if("items" in dusk && object instanceof dusk.Inheritable && object.type == dusk.items.items) {
		
	}else{
		return [this._getRelevant(value, field)];
	}
};

dusk.LayeredStats.prototype._eval = function(expr, field, value, min, max) {
	this._x = value;
	this._min = min;
	this._max = max;
	this._field = field;
	
	return this._tree.compile(expr).eval();
};

dusk.LayeredStats.prototype.tickDown = function(field) {
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

dusk.LayeredStats.prototype._getRelevant = function(object, field) {
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

dusk.LayeredStats.prototype.toString = function() {
	return "[LayeredStats "+this.name+"]";
};
