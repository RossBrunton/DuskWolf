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

load.provide("dusk.tiles.lrTerrainModifier", (function() {
	var dirs = load.require("dusk.utils.dirs");
	var Weights = load.require("dusk.tiles.Weights");
	
	var lrTerrainModifier = function(weights, layeredRoom, path) {
		var transCache = [undefined, null];
		
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			var com;
			var grid;
			
			if(path) {
				com = layeredRoom.get(path);
			}else{
				com = layeredRoom.getScheme();
			}
			
			if(transCache[0] == com) {
				grid = transCache[1];
			}else{
				grid = weights.translate(com.getAllTiles(), com.cols, com.rows);
				transCache[0] = com;
				transCache[1] = grid;
			}
			
			var p = dirProps(dir);
			v += weights.weights[grid[(sy * com.cols) + sx] + Weights.fields[p[0]]];
			v += weights.weights[grid[(dy * com.cols) + dx] + Weights.fields[p[1]]];
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
	
	return lrTerrainModifier;
})());

load.provide("dusk.tiles.EntityModifier", (function() {
	var dirs = load.require("dusk.utils.dirs");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	
	var entityModifier = function(com, ignore, f, path) {
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			var entityGroup;
			
			if(com instanceof EntityGroup) {
				entityGroup = com;
			}else{
				if(path) {
					entityGroup = com.get(path);
				}else{
					entityGroup = com.getPrimaryEntityLayer();
				}
			}
			
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
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	
	var entityValidator = function(com, ignore, f, path) {
		return function(x, y, z, opt) {
			var entityGroup;
			
			if(com instanceof EntityGroup) {
				entityGroup = com;
			}else{
				if(path) {
					entityGroup = com.get(path);
				}else{
					entityGroup = com.getPrimaryEntityLayer();
				}
			}
			
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
