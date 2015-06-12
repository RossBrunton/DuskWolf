//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("weightsTest", (function() {
	window.Runner = load.require("dusk.script.Runner");
	window.Actions = load.require("dusk.script.Actions");
	window.sgui = load.require("dusk.sgui");
	window.Weights = load.require("dusk.tiles.Weights");
	window.Region = load.require("dusk.tiles.Region");
	window.uniformModifier = load.require("dusk.tiles.UniformModifier");
	window.terrainModifier = load.require("dusk.tiles.TerrainModifier");
	window.entityModifier = load.require("dusk.tiles.EntityModifier");
	window.entityValidator = load.require("dusk.tiles.EntityValidator");
	window.Properties = load.require("dusk.tiles.Properties");
	window.dirs = load.require("dusk.utils.dirs");
	window.SelectorManager = load.require("dusk.tiles.SelectorManager");
	window.TileDisplay = load.require("dusk.tiles.sgui.RegionDisplay");
	window.RegionActor = load.require("dusk.rooms.actors.Regions");
	window.SelectActor = load.require("dusk.rooms.actors.Select");
	window.menu = load.require("dusk.script.actors.menu");
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
	
	window.p = new Properties(sgui.path("default:/quest/scheme"));
	
	window.testRegion = new Region(rows, cols, 1);
	testRegion.addWeightModifier(tm);
	//testRegion.addWeightModifier(em);
	testRegion.addValidator(ev);
	
	window.sampleSub = {
		"name":"sample",
		"weightModifiers":[uniformModifier()],
		"ranges":[2, 2],
	};
	
	window.sm = new SelectorManager(sgui.path("default:/quest"));
	testRegion.expand({"x":5, "y":5, "z":0, "ranges":[0, 6], "children":{"attack":sampleSub}});
	window.p = testRegion.getPath(5, 5, 0);
	p.backPop = true;
	p.clamp = 6;
	/*sm.performTask({
		"path":p,
		"controlHandlers":{
			"sgui_action":function(state, options) {
				console.log("Woo");
			}
		},
		"clickHandlers":{
			"1":function(state, options) {
				console.log("Click");
			}
		},
		"onMove":function(state, options) {
			console.log(state.path.toString());
		},
	}).then(console.log.bind(console), console.warn.bind(console));*/
	
	window.regions = sgui.path("default:/quest/regions");
	
	window.menuScript = new Runner([
		menu.gridMenu([
			[{"text":"a"}, [
				Actions.print("A %"),
			]],
			
			[{"text":"b"}, [
				Actions.print("B %"),
			]],
			
			[{"text":"c"}, [
				Actions.print("C %"),
			]],
			
			[{"text":"Kill Everyone"}, [
				Actions.print("Are you sure?"),
				menu.gridMenu([
					[{"text":"Yes"}, [
						Actions.print("Blargh. Everyone is dead!"),
					]],
					
					[{"text":"No"}, false],
					
					], sgui.path("default:/menu/menu"), {}
				),
			]], 
			
			[{"text":"Cancel"}, false],
			
			], sgui.path("default:/menu/menu"), {}
		),
	]);
	
	window.ra = new RegionActor(sgui.path("default:/quest"));
	window.sa = new SelectActor(sgui.path("default:/quest"));
	window.regionScript = new Runner([
		Actions.while(function() {return true}, [
			sa.pickEntity(function() {return true}, {}, {}),
			ra.generate({
				"x":5, "y":5, "z":0, "weightModifiers":[tm], "validators":[ev], "ranges":[0, 6],
				"children":{"attack":sampleSub}
			}, {"copy":[["x", "x"], ["y", "y"]]}),
			ra.display("atk", "#ffffff", {"sub":"attack"}),
			ra.display("mov", "#000000", {}),
			ra.makePath("", {}),
			ra.displayPath("movePath", "default/arrows32.png", {}),
			sa.pickTile({}, {}),
			ra.unDisplay(["atk", "mov", "movePath"], {}),
			sa.followPath({}),
		]),
		
		function() {return Promise.reject(new Runner.Cancel());}
	]);
	
	return undefined;
})());
