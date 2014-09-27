//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.stats", (function() {
	var utils = load.require("dusk.utils");
	var parseTree = load.require("dusk.utils.parseTree");
	var Range = load.require("dusk.utils.Range");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var items = load.suggest("dusk.items", function(p) {items = p});
	
	var stats = {};
	
	var _stats = {};
	
	stats.addStats = function(name, stats, replace) {
		if(name in _stats && !replace) {
			return;
		}
		_stats[name] = [stats, false];
	};
	
	stats.addStatsGenerator = function(name, stats, replace) {
		if(name in _stats && !replace) {
			return;
		}
		_stats[name] = [stats, true];
	};
	
	stats.getStats = function(name) {
		if(!_stats[name]) return null;
		if(_stats[name][1]) {
			return _stats[name][0]();
		}
		return _stats[name][0];
	};
	
	stats.save = function(type, arg, ref) {
		if(type != "stats") return {};
		
		var out = [];
		
		if(!("names" in arg)) {
			for(var p in this._stats) {
				if(!_stats[p][1]) {
					out.push([p, ref(_stats[p][0])]);
				}
			}
		}else{
			for(var p in arg.names) {
				if(!_stats[p][1]) {
					out.push([p, ref(_stats[p][0])]);
				}
			}
		}
		
		return out;
	};
	
	stats.load = function(data, type, arg, unref) {
		if(type != "stats") return;
		
		for(var i = 0; i < data.length; i ++) {
			_stats[data[i][0]] = unref(data[i][1]);
		}
	};
	
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
	stats.LayeredStats = function(name, pack, layerNames) {
		this.name = name;
		this.pack = pack;
		
		this._layers = [];
		this._inventListeners = [];
		this._caches = [];
		this._ranges = [];
		
		this.layerNames = layerNames?layerNames:[];
		this._extras = {};
		
		this.changed = new EventDispatcher("dusk.stats.LayeredStats.changed");
	};
	
	var _tree = new parseTree.Compiler([], [], [
		["X", function(o, c) {return c.x;}],
		["MAX", function(o, c) {return c.max;}],
		["MIN", function(o, c) {return c.min;}],
		["FIELD", function(o, c) {return c.field;}],
		["all", function(o, c) {return c.ls;}],
		["block", function(o, c) {return c.block;}]
	]);
	
	stats.LayeredStats.prototype.addBlock = function(layer, name, block, copy) {
		layer = this._lookupLayer(layer);
		if(copy) block = utils.clone(block);
		if(!this._layers[layer]) this._layers[layer] = {};
		if(!this._inventListeners[layer]) this._inventListeners[layer] = {};
		if(!this._caches[layer]) this._caches[layer] = {};
		if(!this._ranges[layer]) this._ranges[layer] = {};
		
		this._layers[layer][name] = block;
		
		if(items && block instanceof items.Invent) {
			this._inventListeners[layer][name] = block.contentsChanged.listen((function() {
				this.kick(layer);
			}).bind(this))
		}
		
		this.kick(layer);
	};
	
	stats.LayeredStats.prototype.getBlock = function(layer, name) {
		layer = this._lookupLayer(layer);
		
		return this._layers[layer][name];
	};
	
	stats.LayeredStats.prototype.removeBlock = function(layer, name) {
		layer = this._lookupLayer(layer);
		if(!this._layers[layer]) return undefined;
		
		var toReturn = this._layers[layer][name];
		this._layers[layer][name] = undefined;
		
		if(items && toReturn instanceof items.Invent) {
			toReturn.contentsChanged.unlisten(this._inventListeners[layer][name]);
		}
		
		this.kick(layer);
		
		return toReturn;
	};
	
	stats.LayeredStats.prototype.replaceBlock = function(layer, name, block, copy) {
		this.removeBlock(layer, name);
		this.addBlock(layer, name, block, copy);
	};
	
	stats.LayeredStats.prototype.kick = function(layer) {
		layer = this._lookupLayer(layer);
		
		for(var i = layer; i < this._layers.length; i ++) {
			this._caches[i] = {};
			
			for(var p in this._ranges[i]) {
				var r = this._ranges[i][p];
				
				r.min = this.get(p+"_min", i);
				r.max = this.get(p+"_max", i);
				r.value = this.get(p, i);
			}
		}
		
		this.changed.fire();
	};
	
	stats.LayeredStats.prototype.get = function(field, untilLayer) {
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
						if(d[field+"_max"] < max) max = d[field+"_max"];
					if(field+"_min" in d && typeof d[field+"_max"] != "function")
						if(d[field+"_min"] > min) min = d[field+"_min"];
					if(field in d && typeof d[field] != "function") value = d[field];
					
					if(field+"_max" in d && typeof d[field+"_max"] == "function")
						if(d[field+"_max"] < max) max = d[field+"_max"](this, field, value, min, max, d);
					if(field+"_min" in d && typeof d[field+"_max"] == "function")
						if(d[field+"_min"] > min) min = d[field+"_min"](this, field, value, min, max, d);
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
			
			if(max !== null && value !== null && isFinite(max) && value > max) value = max;
			if(min !== null && value !== null && isFinite(min) && value < min) value = min;
		}
		
		if(!this._caches[untilLayer]) this._caches[untilLayer] = {};
		this._caches[untilLayer][field] = value;
		return value;
	};
	
	stats.LayeredStats.prototype.geti = function(field, untilLayer) {
		untilLayer = this._lookupLayer(untilLayer);
		return ~~this.get(field, untilLayer);
	};
	
	stats.LayeredStats.prototype.getRange = function(field, untilLayer) {
		untilLayer = this._lookupLayer(untilLayer);
		if(!this._ranges[untilLayer]) this._ranges[untilLayer] = {};
		
		if(!this._ranges[untilLayer][field]) {
			var r = new Range(
				this.get(field+"_min", untilLayer), this.get(field+"_max", untilLayer), this.get(field, untilLayer)
			);
			
			this._ranges[untilLayer][field] = r;
			return r;
		}else{
			return this._ranges[untilLayer][field];
		}
	};
	
	stats.LayeredStats.prototype.countInLayer = function(layer) {
		layer = this._lookupLayer(layer);
		return Object.keys(this._layers[layer]).length;
	};
	
	stats.LayeredStats.prototype.getMaxInLayer = function(field, layer) {
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
	
	stats.LayeredStats.prototype.getMinInLayer = function(layer, field) {
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
	
	stats.LayeredStats.prototype._toList = function(value, field) {
		if(items && value instanceof items.Invent) {
			var out = [];
			value.forEach((function(item, slot) {
				if(item.get("stats")) {
					var block = utils.clone(item.get("stats"));
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
	
	stats.LayeredStats.prototype._eval = function(expr, field, value, min, max, block) {
		return _tree.compile(expr).eval({"x":value, "min":min, "max":max, "field":field, "block":block, "ls":this});
	};
	
	stats.LayeredStats.prototype._lookupLayer = function(layer) {
		if(!isNaN(layer)) return layer;
		
		for(var i = 0; i < this.layerNames; i ++) {
			if(this.layerNames[i] == layer) return i;
		}
		
		if(!layer) return this._layers.length-1;
		
		console.log("Unknown layer "+layer);
		return undefined;
	};
	
	stats.LayeredStats.prototype.tickDown = function(field) {
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
	
	stats.LayeredStats.prototype._getRelevant = function(object, field) {
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
	
	stats.LayeredStats.prototype.getExtra = function(name) {
		if(!(name in this._extras)) return null;
		return this._extras[name];
	};
	
	stats.LayeredStats.prototype.setExtra = function(name, object) {
		this._extras[name] = object;
	};
	
	stats.LayeredStats.prototype.refSave = function(ref) {
		var out = [];
		
		for(var i = 0; i < this._layers.length; i ++) {
			out[i] = {};
			
			for(var b in this._layers[i]) {
				out[i][b] = ref(this._layers[i][b]);
			}
		}
		
		return [out, this.name, this.pack, this.layerNames];
	};
	
	stats.refLoad = function(data, unref) {
		var stats = new stats.LayeredStats(data[1], data[2], data[3]);
		var layers = data[0];
		
		for(var i = 0; i < layers.length; i ++) {
			for(var b in layers[i]) {
				stats.addBlock(i, b, unref(layers[i][b]));
			}
		}
		
		return stats;
	};
	
	stats.LayeredStats.prototype.refClass = stats.LayeredStats.refClass = function() {
		return "dusk.stats";
	};
	
	stats.LayeredStats.prototype.toString = function() {
		return "[LayeredStats "+this.name+"]";
	};
	
	return stats;
})());
