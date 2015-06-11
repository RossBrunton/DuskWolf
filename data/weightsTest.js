//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("weightsTest", (function() {
	window.sgui = load.require("dusk.sgui");
	window.Weights = load.require("dusk.tiles.Weights");
	window.Region = load.require("dusk.tiles.Region");
	window.uniformModifier = load.require("dusk.tiles.UniformModifier");
	window.terrainModifier = load.require("dusk.tiles.TerrainModifier");
	window.entityModifier = load.require("dusk.tiles.EntityModifier");
	window.entityValidator = load.require("dusk.tiles.EntityValidator");
	window.dirs = load.require("dusk.utils.dirs");
	load.require("quest");
	
	window.map = sgui.path("default:/quest/scheme")._tiles[0];
	window.rows = sgui.path("default:/quest/scheme").rows;
	window.cols = sgui.path("default:/quest/scheme").cols;
	
	window.w = new Weights(9, 2);
	w.addSimpleWeight(0, 0, 1, 0);
	w.addSimpleWeight(1, 0, 100, 0);
	w.addSimpleWeight(2, 0, 100, 0);
	w.addSimpleWeight(3, 0, 2, 0);
	
	var tm = terrainModifier(w, [w.translate(map, cols, rows)], cols, rows, 1);
	var em = entityModifier(sgui.path("default:/quest").getPrimaryEntityLayer(), [], function() {return 100;});
	var ev = entityValidator(sgui.path("default:/quest").getPrimaryEntityLayer(), [], function() {return false;});
	
	window.testRegion = new Region(rows, cols, 1);
	testRegion.addWeightModifier(tm);
	//testRegion.addWeightModifier(em);
	testRegion.addValidator(ev);
	
	window.sampleSub = {
		"name":"sample",
		"weightModifiers":[uniformModifier()],
		"ranges":[2, 2],
	};
	
	return undefined;
})());
