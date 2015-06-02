//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.stats.LayeredStatsLayer", (function() {
	var utils = load.require("dusk.utils");
	var Range = load.require("dusk.utils.Range");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var functionStore = load.require("dusk.utils.functionStore");
	var items = load.suggest("dusk.items", function(p) {items = p});
	
	/** A LayeredStatsLayer is a single layer for a `dusk.stats.LayeredStats` instance.
	 * 
	 * See the documentation for that for more details on how it works.
	 * 
	 * @since 0.0.21-alpha
	 * @constructor
	 * @param {string} name The name of this layer.
	 */
	var LayeredStatsLayer = function(name) {
		/** The layer name.
		 * @type string
		 */
		this.name = name;
		
		/** All the blocks on this layer.
		 * @type Map<string, object|dusk.items.Invent>
		 * @private
		 */
		this._blocks = new Map();
		//this._inventListeners = new Map();
		//this._caches = [];
		//this._ranges = [];
		
		//this.changed = new EventDispatcher("dusk.LayeredStatsLayer.changed");
	};
	
	/** Adds a new block to the layer.
	 * @param {string} The name of the block.
	 * @param {object|dusk.items.Invent} The block to add.
	 * @param {boolean=false} If true, then the block will be copied (using `dusk.utils.copy`) before it is added.
	 */
	LayeredStatsLayer.prototype.addBlock = function(name, block, copy) {
		if(copy) block = utils.copy(block, true);
		this._blocks.set(name, block);
		
		if(items && block instanceof items.Invent) {
			//this._inventListeners.set(name, block.contentsChanged.listen((function() {
				//this.update(layer);
			//}).bind(this)))
		}
	};
	
	/** Returns the block with the given name.
	 * @param {string} name The block to get.
	 * @return {object|dusk.items.Invent} The block with that name.
	 */
	LayeredStatsLayer.prototype.getBlock = function(name) {
		return this._blocks.get(name);
	};
	
	/** Removes a block from the layer.
	 * @param {string} name The name of the block to remove.
	 * @return {object|dusk.items.Invent} The block that was removed.
	 */
	LayeredStatsLayer.prototype.removeBlock = function(name) {
		var toReturn = this._blocks.get(name);
		this._blocks.delete(name);
		
		//if(items && toReturn instanceof items.Invent) {
		//	toReturn.contentsChanged.unlisten(this._inventListeners.get(name));
		//}
		
		return toReturn;
	};
	
	/** Removes the block, then adds another block with the same name.
	 * @param {string} name The name of the block to replace.
	 * @param {object|dusk.items.Invent} The new block to add.
	 * @param {boolean=false} Whether to copy the block.
	 * @return {object|dusk.items.Invent} The old block that was removed.
	 */
	LayeredStatsLayer.prototype.replaceBlock = function(name, block, copy) {
		var ret = this.removeBlock(name);
		this.addBlock(name, block, copy);
		return ret;
	};
	
	/** Returns the value, minimum and maximum obtained after applying all the transformations on this layer.
	 * @param {string} field The field to get the values for.
	 * @param {*} value The initial value.
	 * @param {number} min The initial minimum value.
	 * @param {number} max The initial maximum value.
	 * @return {array<*>} A `[value, min, max]` triplet representing the state after all the transformations.
	 */
	LayeredStatsLayer.prototype.getAll = function(field, value, min, max) {
		var list = [];
		
		for(var b of this._blocks.values()) {
			list = _toList(b, field);
			
			for(var j = 0; j < list.length; j ++) {
				var d = list[j];
				functionStore.vars.set("layeredstats-block", d);
				
				if(field+"_max_mod" in d) max = _eval(d[field+"_max_mod"], max);
				if(field+"_min_mod" in d) min = _eval(d[field+"_min_mod"], min);
				if(field+"_mod" in d) value = _eval(d[field+"_mod"], value);
				
				if(field+"_max" in d) max = d[field+"_max"];
				if(field+"_min" in d) min = d[field+"_min"];
				if(field in d) value = d[field];
				
				if(field+"_max_add" in d) max += d[field+"_max_add"];
				if(field+"_min_add" in d) min += d[field+"_min_add"];
				if(field+"_add" in d) value += d[field+"_add"];
				
				if(field+"_max_mul" in d) max += d[field+"_max_mul"];
				if(field+"_min_mul" in d) min += d[field+"_min_mul"];
				if(field+"_mul" in d) value += d[field+"_mul"];
			}
		}
		
		if(max !== null && value !== null && isFinite(max) && value > max) value = max;
		if(min !== null && value !== null && isFinite(min) && value < min) value = min;
		
		return [value, min, max];
	};
	
	/** Takes a block, and returns an array of every object that it is comprised of.
	 * 
	 * If the block is a basic object, a single element array with it inside is returned. If it is an inventory, an
	 * array of items' stats value is returned.
	 * 
	 * @param {object|dusk.items.Invent} block The block to check.
	 * @param {string} field The field to check.
	 * @return {array<object>} An array of all the objects that can affect the stat.
	 * @private
	 */
	var _toList = function(block, field) {
		if(items && block instanceof items.Invent) {
			var out = [];
			block.forEach((function(item, slot) {
				if(item.get("stats")) {
					var block = utils.copy(item.get("stats"));
					block.item = item;
					block.slot = slot;
					this.push(block);
				}
			}).bind(out));
			return out;
		}else{
			return [_getRelevant(block, field)];
		}
	};
	
	/** Calls the appropriate function stored function on the given arg.
	 * 
	 * If the expr is not a string, it is simply returned.
	 * @param {string|*} expr The expression to evaluate.
	 * @param {*} arg The argument given to the function.
	 * @return {*} The return value of the stored function.
	 * @private
	 */
	var _eval = function(expr, arg) {
		if(typeof expr != "string") return expr;
		return functionStore.eval(expr)(arg);
	};
	
	/** Ticks down this layer.
	 * 
	 * For each block, do the following:
	 * - Check the given field and decrement it by one.
	 * - If the field is zero, then remove the block from this layer.
	 * 
	 * @param {string} field The field to tick down.
	 */
	LayeredStatsLayer.prototype.tickDown = function(field) {
		for(var b of this._blocks) {
			for(var p in b[0]) {
				var d = _getRelevant(b[1][p]);
				if(field in d) {
					d[field] --;
					if(d[field] <= 0) {
						this.removeBlock(b[0], p);
					}
				}
			}
		}
	}
	
	/** Returns an object with relevent properties for the given block.
	 * 
	 * If the object lacks a "get" function, then the object is just returned. If it does have a get method, then an
	 * object containing the output from "get" with all the relevent properties is returned.
	 * 
	 * @param {object} object The object to process.
	 * @param {string} field The field to process.
	 * @return {object} An object with all relevent fields set.
	 * @private
	 */
	var _getRelevant = function(object, field) {
		if(!object) return {};
		
		if("get" in object && typeof object.get == "function") {
			var out = {};
			
			if(object.get(field) !== undefined) out[field] = object.get(field);
			if(object.get(field+"_mod") !== undefined) out[field+"_mod"] = object.get(field+"_mod");
			if(object.get(field+"_add") !== undefined) out[field+"_add"] = object.get(field+"_add");
			if(object.get(field+"_mul") !== undefined) out[field+"_mul"] = object.get(field+"_mul");
			
			if(object.get(field+"_max") !== undefined) out[field+"_max"] = object.get(field+"_max");
			if(object.get(field+"_max_mod") !== undefined) out[field+"_max_mod"] = object.get(field+"_max_mod");
			if(object.get(field+"_max_add") !== undefined) out[field+"_max_add"] = object.get(field+"_max_add");
			if(object.get(field+"_max_mul") !== undefined) out[field+"_max_mul"] = object.get(field+"_max_mul");
			
			if(object.get(field+"_min") !== undefined) out[field+"_min"] = object.get(field+"_min");
			if(object.get(field+"_min_mod") !== undefined) out[field+"_min_mod"] = object.get(field+"_min_mod");
			if(object.get(field+"_min_add") !== undefined) out[field+"_min_add"] = object.get(field+"_min_add");
			if(object.get(field+"_min_mul") !== undefined) out[field+"_min_mul"] = object.get(field+"_min_mul");
			
			return out;
		}else{
			return object;
		}
	};
	
	/** Saves a reference to this LayeredStatsLayer for the save system.
	 * @param {function(**):*} ref The reffing function.
	 * @return {array} The saved data for this LayeredStatLayer
	 */
	LayeredStatsLayer.prototype.refSave = function(ref) {
		var out = {};
		
		for(var b of this._blocks) {
			out[b[0]] = ref(b[1]);
		}
		
		return [out, this.name];
	};
	
	/** Creates a new LayeredStatsLayer as described by the save data.
	 * @param {array} data The saved data.
	 * @param {function(*):*} The unreffing function.
	 * @return {dusk.stats.LayeredStatsLayer} The LayeredStatsLayer.
	 */
	LayeredStatsLayer.refLoad = function(data, unref) {
		var layer = new LayeredStatsLayer(data[1]);
		var blocks = data[0];
		
		for(var b in blocks) {
			layer.addBlock(b, unref(blocks[b]));
		}
		
		return layer;
	};
	
	/** Returns the module path so that the save system knows what to load it with.
	 * @return {string} The string "dusk.stats.LayeredStatsLayer".
	 */
	LayeredStatsLayer.prototype.refClass = LayeredStatsLayer.refClass = function() {
		return "dusk.stats.LayeredStatsLayer";
	};
	
	/** Returns a string representation of this layer.
	 * @return {string} A string representation.
	 */
	LayeredStatsLayer.prototype.toString = function() {
		return "[LayeredStatsLayer "+this.name+"]";
	};
	
	return LayeredStatsLayer;
})());
