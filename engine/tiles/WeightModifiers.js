//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/*load.provide("dusk.tiles.TerrainModifier", (function() {
	var terrainModifier = function(weights, grids) {
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			return v+1;
		}
	};
	
	return terrainModifier 
})());*/

load.provide("dusk.tiles.UniformModifier", (function() {
	var uniformModifier = function(n) {
		if(n === undefined) n = 1;
		return function(v, opt, dir, sx, sy, sz, dx, dy, dz) {
			return v+n;
		}
	};
	
	return uniformModifier 
})());
