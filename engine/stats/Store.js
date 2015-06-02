//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.stats.store", (function() {
	var utils = load.require("dusk.utils");
	var parseTree = load.require("dusk.utils.parseTree");
	var Range = load.require("dusk.utils.Range");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var items = load.suggest("dusk.items", function(p) {items = p});
	
	var store = {};
	
	var _stats = new Map();
	var _generators = new Map();
	
	store.addStats = function(name, stats, replace) {
		if(_stats.has(name) && !replace) {
			return;
		}
		_stats.set(name, stats);
	};
	
	store.getStats = function(name) {
		if(!_stats.has(name)) return null;
		
		return _stats.get(name);
	};
	
	store.addGenerator = function(name, stats, replace) {
		if(_generators.has(name) && !replace) {
			return;
		}
		_generators.set(name, stats);
	};
	
	store.getGenerator = function(name) {
		if(!_generators.has(name)) return null;
		
		return _generators.get(name);
	};
	
	store.save = function(type, arg, ref) {
		if(type != "stats") return {};
		
		var out = [];
		
		if(!("names" in arg)) {
			for(var s of _stats) {
				out.push([s[0], ref(s[1])]);
			}
		}else{
			for(var p of arg.names) {
				out.push([p, ref(_stats.get(p))]);
			}
		}
		
		return out;
	};
	
	store.load = function(data, type, arg, unref) {
		if(type != "stats") return;
		
		for(var d of data) {
			_stats.set(d[0], unref(d[1]));
		}
	};
	
	return store;
})());
