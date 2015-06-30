//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.stats", (function() {
	var utils = load.require("dusk.utils");
	var Range = load.require("dusk.utils.Range");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var LayeredStatsLayer = load.require("dusk.stats.LayeredStatsLayer");
	var items = load.suggest("dusk.items", function(p) {items = p});
	
	var stats = {};
	
	/** LayeredStats allow you to store stats (such as attack, speed, status conditions and so on) about something.
	 * 
	 * The system is broken down into several layers, which are then broken down into blocks. To get the value of a stat
	 * all the layers are looped through in order. The blocks in this layer may specify a value for a stat, a function
	 * to call on the stat or values/functions for the maximum and minimum value. Once all of these are processed, the
	 * value is capped to be in the range and passed onto the next highest layer for it to do its processing.
	 * 
	 * For example, one layer could be for base stats, one layer can be for stats gained in a level up, and one layer
	 * can be for temporary stat changes in battles. If you wanted to level up a character, you can simply either add
	 * a new block or edit the values on an existing block (depending on the type of game) in the level up layer. If
	 * someone goes into battle and gets their attack lowered, a block can be added to the topmost layer. The new value
	 * and the original value of the stat can be easily obtained (depending on what the highest level you specify is),
	 * and this stat change can be reverted at the end of battle by removing all the blocks from the layer.
	 * 
	 * In terms of implementation, this can be thought of as a list of `LayeredStatsLayer` instances in order, with
	 * convienience methods for getting stat values from those layers.
	 * 
	 * The layers function as a pipeline; each taking in the value, minimum and maximum from the previous layer, making
	 * changes, and then passing them onto the next layer.
	 * 
	 * The blocks that can be stored on these layers can be either `dusk.items.Invent` instances or JavaScript objects.
	 * The properties of the objects are as follows, with "x" standing in for the name of the stat being looked up:
	 * - x: Set the value of the stat to this value.
	 * - x_mod: Call the function specified by this as per `dusk.utils.functionStore` with the current value.
	 * - x_add: Add this value to the stat.
	 * - x_mul: Multiply the stat by this value.
	 * - x_max, x_max_mod, x_max_add, x_max_mul: Change the maximum value of the stat as appropriate.
	 * - x_min, x_min_mod, x_min_add, x_min_mul: Change the minimum value of the stat as appropriate.
	 * 
	 * When using an inventory, the "stats" property of each item is taken, and treated as above.
	 * 
	 * The default for a stat is 0 with maximum and minimum of Number.MAX_SAFE_INTEGER and -Number.MIN_SAFE_INTEGER.
	 * Non-number values are acceptible as stat values, although _add and _mul may not work as you expect.
	 * 
	 * Having the following properties on the same layer for the same stats results in unspecified behavior:
	 * - x and any other property.
	 * - x_add and x_mul.
	 * - x_mod depending on what it changes; the order that the transformations happen isn't specified.
	 * Restricting to the max and min value is done after all the blocks are processed, so the value of the stat may be
	 * increased to a value higher than the older maximum (but less than the new one) or lower than the older minimum.
	 * 
	 * Instead of the layer numbers, names can be given to layers. This is recommended in case you wish to add more
	 * layers later in development.
	 * 
	 * In addition to the layers, extra data can be associated to the LayeredStats instane via the `getExtra` and
	 * `setExtra` methods. This can be used to store anything else that shouldn't affect the stats, but should be kept
	 * with the "entity" that the LayeredStats is describing, such as their inventory.
	 * 
	 * In the `dusk.utils.functionStore`, the following varibles are used:
	 * - layeredstats-block: The block being processed.
	 * 
	 * @since 0.0.21-alpha
	 * @constructor
	 * @param {string} name The name of this particular LayeredStats.
	 * @param {string} pack A package that should be imported as a dependency for this layeredstats. Probably pointless.
	 * @param {array<string>} layerNames An array of layer names, used to refer to them rather than numbers. This should
	 * be specified in bottom-up order.
	 */
	stats.LayeredStats = function(name, pack, layerNames) {
		/** The name of this particular LayeredStats.
		 * @type string
		 */
		this.name = name;
		/** The package required to import this LayeredStats.
		 * 
		 * I don't see why this would be usefull...
		 * @type string
		 */
		this.pack = pack;
		
		/** An array storing all the LayeredStatsLayer instances.
		 * @type array<dusk.stats.LayeredStatsLayer>
		 * @private
		 */
		this._layers = [];
		
		/** The layer names, in the same order as the layers.
		 * @type array<string>
		 */
		this.layerNames = layerNames?layerNames:[];
		
		/** The extras associated with this LayeredStats.
		 * @type Map<string, *>
		 * @private
		 */
		this._extras = new Map();
	};
	
	/** Returns the LayeredStatsLayer with the given name or at the location.
	 * @param {string|integer} The location or name of the layer.
	 * @return {dusk.stats.LayeredStatsLayer} The layer at this location.
	 */
	stats.LayeredStats.prototype.layer = function(layer) {
		var layerno = this._lookupLayer(layer);
		
		if(!this._layers[layerno]) {
			this._layers[layerno] = new LayeredStatsLayer(layer);
		}
		
		return this._layers[layerno];
	};
	
	/** Returns the value, minimum and maximums of the specified field.
	 * @param {string} field The field to look up.
	 * @param {integer|string=Number.MAX_SAFE_INTEGER} until Any layers higher than this one will not be processed.
	 * @return {array<*>} A `[value, min, max]` triplet with the calculated values.
	 */
	stats.LayeredStats.prototype.getAll = function(field, until) {
		var min = Number.MIN_SAFE_INTEGER;
		var max = Number.MAX_SAFE_INTEGER;
		var value = 0;
		if(until == undefined) {
			until = Number.MAX_SAFE_INTEGER;
		}else{
			until = this._lookupLayer(until);
		}
		
		for(var l of this._layers) {
			if(until-- < 0) break;
			
			if(l) {
				var out = l.getAll(field, value, min, max);
				value = out[0];
				min = out[1];
				max = out[2];
			}
		}
		
		return [value, min, max];
	};
	
	/** Returns the value the specified field.
	 * @param {string} field The field to look up.
	 * @param {integer|string=Number.MAX_SAFE_INTEGER} until Any layers higher than this one will not be processed.
	 * @return {*} The value of the field.
	 */
	stats.LayeredStats.prototype.getValue = function(field, until) {
		return this.getAll(field, until)[0];
	};
	
	/** Returns the value the specified field.
	 * @param {string} field The field to look up.
	 * @param {integer|string=Number.MAX_SAFE_INTEGER} until Any layers higher than this one will not be processed.
	 * @return {*} The value of the field.
	 */
	stats.LayeredStats.prototype.get = function(field, until) {
		return this.getAll(field, until)[0];
	};
	
	/** Returns the minimum value the specified field.
	 * @param {string} field The field to look up.
	 * @param {integer|string=Number.MAX_SAFE_INTEGER} until Any layers higher than this one will not be processed.
	 * @return {*} The minimum value of the field.
	 */
	stats.LayeredStats.prototype.getMin = function(field, until) {
		return this.getAll(field, until)[1];
	};
	
	/** Returns the maximum value the specified field.
	 * @param {string} field The field to look up.
	 * @param {integer|string=Number.MAX_SAFE_INTEGER} until Any layers higher than this one will not be processed.
	 * @return {*} The maximum value of the field.
	 */
	stats.LayeredStats.prototype.getMax = function(field, until) {
		return this.getAll(field, until)[2];
	};
	
	/** Returns the value of the specified field, and rounds it to the nearest integer.
	 * @param {string} field The field to look up.
	 * @param {integer|string=Number.MAX_SAFE_INTEGER} until Any layers higher than this one will not be processed.
	 * @return {integer} The value of the field.
	 */
	stats.LayeredStats.prototype.getValueInt = function(field, until) {
		return ~~this.getValue(field, until);
	};
	
	/** Returns the number of the layer, possibly from a string.
	 * 
	 * If the param is a string, the layer number with that name will be returned. If it is an integer, then it is
	 * just returned.
	 * @param {string|integer} layer The layer name or value to look up.
	 * @return {integer} The layer this value refers to.
	 * @private
	 */
	stats.LayeredStats.prototype._lookupLayer = function(layer) {
		if(!isNaN(layer)) return layer;
		
		for(var i = 0; i < this.layerNames.length; i ++) {
			if(this.layerNames[i] == layer) return i;
		}
		
		//if(!layer) return this._layers.length-1;
		
		console.log("Unknown layer "+layer);
		return undefined;
	};
	
	/** For each layer, calls it's `tickDown` method, which will reduce the field value by 1 on all blocks. If the field
	 * value goes to 0, then that block is removed.
	 * 
	 * This can be used for status conditions that expire after a few turns, for example.
	 * @param {string} field The field to tick down.
	 */
	stats.LayeredStats.prototype.tickDown = function(field) {
		for(var l of this._layers) {
			l.tickDown(field);
		}
	}
	
	/** Gets the extra data with the given key.
	 * @param {string} name The extra's name.
	 * @return {*} The data stored under this name.
	 */
	stats.LayeredStats.prototype.getExtra = function(name) {
		if(!this._extras.has(name)) return null;
		return this._extras.get(name);
	};
	
	/** Sets the extra data to the given key.
	 * @param {string} name The extra's name.
	 * @param {*} The value to set to this extra.
	 */
	stats.LayeredStats.prototype.setExtra = function(name, object) {
		this._extras.set(name, object);
	};
	
	/** Stores a reference to this LayeredStats so it can be saved with the save system.
	 * @param {function(*):*} ref The reffing function.
	 * @return {array} Data describing this LayeredStats.
	 */
	stats.LayeredStats.prototype.refSave = function(ref) {
		var out = [];
		
		for(var i = 0; i < this._layers.length; i ++) {
			out[i] = ref(this._layers[i]);
		}
		
		var extras = {};
		for(var e of this._extras) {
			extras[e[0]] = ref(e[1]);
		}
		
		return [out, this.name, this.pack, this.layerNames, extras];
	};
	
	/** The load function for a LayeredStats.
	 * @param {array} data The data to load.
	 * @param {function(*):*} The unreffing function.
	 * @return {dusk.stats.LayeredStats} The LayeredStats represented by the save data reference.
	 */
	stats.refLoad = function(data, unref) {
		var inst = new stats.LayeredStats(data[1], data[2], data[3]);
		var layers = data[0];
		
		for(var i = 0; i < layers.length; i ++) {
			inst._layers[i] = unref(layers[i]);
		}
		
		for(var p in data[4]) {
			inst.setExtra(p, unref(data[4][p]));
		}
		
		return inst;
	};
	
	/** Returns the package used to load a LayeredStats from save data.
	 * @return {string} The string "dusk.stats".
	 */
	stats.LayeredStats.prototype.refClass = stats.LayeredStats.refClass = function() {
		return "dusk.stats";
	};
	
	/** Returns a string representation of this LayeredStats.
	 * @return {string} A string representation of this LayeredStats.
	 */
	stats.LayeredStats.prototype.toString = function() {
		return "[LayeredStats "+this.name+"]";
	};
	
	return stats;
})());
