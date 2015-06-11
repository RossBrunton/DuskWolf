//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.TerrainModifier", (function() {
	var dirs = load.require("dusk.utils.dirs");
	var Weights = load.require("dusk.tiles.Weights");
	
	var terrainModifier = function(weights, grids, cols, rows, layers) {
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			var p = dirProps(dir);
			v += weights.weights[grids[sz][(sy * cols) + sx] + Weights.fields[p[0]]];
			v += weights.weights[grids[dz][(dy * cols) + dx] + Weights.fields[p[1]]];
			return v;
		};
	};
	
	var dirProps = function(dir) {
		switch(dir) {
			case dirs.N: return ["exitN", "enterS"];
			case dirs.S: return ["exitS", "enterN"];
			case dirs.E: return ["exitE", "enterW"];
			case dirs.W: return ["exitW", "enterE"];
			case dirs.U: return ["exitU", "enterD"];
			case dirs.D: return ["exitD", "enterU"];
			default: return undefined;
		}
	}
	
	return terrainModifier;
})());

load.provide("dusk.tiles.EntityModifier", (function() {
	var dirs = load.require("dusk.utils.dirs");
	
	var entityModifier = function(entityGroup, ignore, f) {
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			for(var e of entityGroup.getEntitiesExactlyHere(dx * entityGroup.twidth, dy * entityGroup.theight, ignore)){
				v = f(v, e, opt, dir);
			}
			return v;
		};
	};
	
	return entityModifier;
})());

load.provide("dusk.tiles.EntityValidator", (function() {
	var dirs = load.require("dusk.utils.dirs");
	
	var entityValidator = function(entityGroup, ignore, f) {
		return function(x, y, z, opt) {
			for(var e of entityGroup.getEntitiesExactlyHere(x * entityGroup.twidth, y * entityGroup.theight, ignore)) {
				if(!f(e, opt)) return false;
			}
			return true;
		};
	};
	
	return entityValidator; 
})());

load.provide("dusk.tiles.UniformModifier", (function() {
	var uniformModifier = function(n) {
		if(n === undefined) n = 1;
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			return v+n;
		}
	};
	
	return uniformModifier 
})());
