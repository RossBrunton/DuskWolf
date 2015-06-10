//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("weightsTest", (function() {
	window.sgui = load.require("dusk.sgui");
	window.Weights = load.require("dusk.tiles.Weights");
	window.Region = load.require("dusk.tiles.Region");
	window.UniformModifier = load.require("dusk.tiles.UniformModifier");
	window.dirs = load.require("dusk.utils.dirs");
	load.require("quest");
	
	window.map = sgui.path("default:/quest/scheme")._tiles[0];
	
	window.w = new Weights(9, 2);
	w.addSimpleWeight(1, 0, 1, 0);
	
	window.testRegion = new Region(10, 10, 2);
	testRegion.addWeightModifier(UniformModifier());
	
	window.sampleSub = {
		"name":"sample",
		"weightModifiers":[UniformModifier()],
		"ranges":[2, 2],
	};
	
	return undefined;
})());
