//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("animationTest", (function() {
	load.require("dusk.sgui.DynamicGrid");
	load.require("dusk.input.sgui.ControlConfig");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.Image");
	load.require("dusk.particles.particleEffects.core.spread");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.entities.sgui.EntityWorkshop");
	load.require("dusk.sgui.TextBack");
	load.require("dusk.tiles.sgui.Tile");
	load.require("dusk.tiles.sgui.extras.AnimatedTile");
	var atTypes = load.require("dusk.tiles.sgui.extras.animationTypes");
	
	var SaveSpec = load.require("dusk.save.SaveSpec");
	var checkpoints = load.require("dusk.checkpoints");
	
	var dplat = load.require("dusk.rooms.plat");
	var entities = load.require("dusk.entities");
	var dusk = load.require("dusk");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var controls = load.require("dusk.input.controls");
	var frameTicker = load.require("dusk.utils.frameTicker");
	var Range = load.require("dusk.utils.Range");
	
	window.root = sgui.get("default", true);
	
	root.update({
		"children":{
			"gr":{
				"type":"Grid",
				"rows":10,
				"cols":10,
				"width":320,
				"height":320,
				"globals":{
					"type":"Tile",
					"tile":"1,0",
					"swidth":16,
					"sheight":16,
					"src":"testTiles.png mono;tiles:16x16",
					"width":32,
					"height":32,
					"extras":{
						"animation":{
							"type":"AnimatedTile",
							"animations":[
								["default", [
									atTypes.setTile(0, 0), atTypes.setTile(1, 0)
								], {"trigger":function(){return true}}],
								["rand", [
									atTypes.removeTrans("cor:0.5"), atTypes.setTile(0, 1), atTypes.setTile(1, 1),
									atTypes.cond(function() {return Math.random() > 0.5;}, 1),
									atTypes.addTrans("cor:0.5", true)
								], {"trigger":function(){return Math.random() > 0.99}, "loops":true}],
								["test", [
									
								], {}],
							]
						},
					}
				},
				"populate":{}
			}
		}
	});
	
	window.at = root.get("gr").get("0,0").getExtra("animation");
	
	dusk.startGame();
})());
