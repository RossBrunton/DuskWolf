//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.plat", (function() {
	load.require("dusk.entities.behave.HitDam");
	load.require("dusk.entities.behave.Killable");
	load.require("dusk.entities.behave.PlayerControl");
	load.require("dusk.entities.behave.Jumper");
	load.require("dusk.entities.behave.Spawner");
	load.require("dusk.entities.behave.MarkTrigger");
	load.require("dusk.entities.behave.Volatile");
	load.require("dusk.checkpoint.behave.Checkpoint");
	var Persist = load.require("dusk.entities.behave.Persist");
	load.require("dusk.entities.behave.BackForth");
	load.require("dusk.entities.behave.Fall");
	load.require("dusk.entities.behave.Push");
	load.require("dusk.entities.behave.Gravity");
	load.require("dusk.entities.behave.LimitedLife");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var Pickup = load.require("dusk.entities.behave.Pickup");
	load.require("dusk.entities.behave.HealthRestore");
	var InteractableTarget = load.require("dusk.entities.behave.InteractableTarget");
	var at = load.require("dusk.tiles.sgui.extras.animationTypes");
	var ta = load.require("dusk.rooms.tileAnimations");
	
	load.require("dusk.sgui.DynamicGrid");
	load.require("dusk.input.sgui.ControlConfig");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.Image");
	load.require("dusk.particles.particleEffects.core.spread");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.entities.sgui.EntityWorkshop");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	
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
	
	load.require("example.plat.rooms.exhall");
	
	var Scriptable = load.require("dusk.entities.behave.Scriptable");
	
	var plat = {};
	
	entities.twidth = 32;
	entities.theight = 32;
	
	plat.health = new Range(0, 5, 0);
	
	var layers = [
		{"name":"back","type":1},
		{"name":"scheme","type":2},
		{"name":"entities","type":4,"primary":true},
		{"name":"parts","type":8},
		{"name":"over","type":1},
		{"name":"fluid","type":LayeredRoom.LAYER_FLUID}
	];
	
	var root = sgui.get("default", true).get("plat2", "Group");
	window.dplatOut = dplat.make(root, "orange", layers, 32, 32);
	dplatOut.tileProperties.add(1, 0, EntityGroup.SOLID_TILE);
	
	dplatOut.layeredRoom.seek = "hero";
	dplatOut.layeredRoom.seekType = "player";
	
	var _playerAni = [
		["standRight", [
			at.setTile(0,0),
		], {"trigger":function(){return true;}}],
		["standLeft", [at.setTile(0,1)], {"trigger":function(st){return st.headingLeft;}}],
		
		["walkRight", [
			at.setState("headingLeft", false), at.setTile(0,0), at.setTile(1,0), at.setTile(0,0), at.setTile(2,0)
		], {"holds":true, "trigger":function(st, ent) {
			return ent.dx > 0 && !ent.touchers(c.DIR_RIGHT).length;
		}}],
		
		["walkLeft", [
			at.setState("headingLeft", true), at.setTile(0,1), at.setTile(1,1), at.setTile(0,1), at.setTile(2,1)
		], {"holds":true, "trigger":function(st, ent) {
			return ent.dx < 0 && !ent.touchers(c.DIR_LEFT).length;
		}}],
		
		["jumpUpRight", [
			at.setTile(3,0)
		], {"holds":true, "trigger":function(st, ent) {
			return ent.dy < 0
		}}],
		
		["jumpUpLeft", [
			at.setTile(3,1)
		], {"holds":true, "trigger":function(st, ent) {
			return ent.dy < 0 && st.headingLeft
		}}],
		
		["jumpDownRight", [
			at.setTile(4,0)
		], {"holds":true, "trigger":function(st, ent) {
			return ent.dy >= 0 && !ent.touchers(c.DIR_DOWN).length
		}}],
		
		["jumpDownLeft", [
			at.setTile(4,1)
		], {"holds":true, "trigger":function(st, ent) {
			return ent.dy >= 0  && !ent.touchers(c.DIR_DOWN).length && st.headingLeft
		}}],
		
		["ent_terminate", [
			at.setTile(0,1), at.setTile(0,2), at.setTile(1,2), at.setTile(2,2), at.setTile(3,2), at.setTile(4,2),
			at.setTile(5,2), at.setTile(6,2), at.setTile(7,2), 
		], {}],
		
		["groundparts", [
			ta.particle(dplatOut.layeredRoom, function(state, ent) {
				return {"name":"spew", "x":[ent.x, ent.x+32], "y":[ent.y, ent.y+32], "r":[0, 255], "g":[0, 255], "b":[0, 255], "count":100, "lifespan":60};
			})
		], {"unsettable":true, "trigger":function(){return true;}, "cooldown":60}],
		
		["landsmash", [
			ta.particle(dplatOut.layeredRoom, function(state, ent) {
				return {"name":"image", "source":"duskwolf:"+ent.fullPath()+"?w=32;h=32", "x":ent.x+16, "y":ent.y+16, "child":{
					"effect":"spew", "lifespan":10, "dx":0, "dy":0
				}, "alterU":{"dy":0.5}};
			})
		], {"unsettable":true, "trigger":function(state, ent){return ent.touchers(c.DIR_DOWN).length;}, "waitFalse":true}],
	];
	
	var __playerAni = [
		["true", "0,0", {}],
		[":headingLeft", "0,1", {}],
		["#dx != 0", '0,0|1,0|0,0|2,0', {"name":"walkRight"}],
		["#dx != 0 & :headingLeft", "0,1|1,1|0,1|2,1", {}],
		["#dy<0", "3,0", {}],
		["#dy<0 & :headingLeft=true", "3,1", {}],
		["#dy>0 & #tb=0", "4,0", {}],
		["#dy>0 & :headingLeft=true & #tb=0", "4,1", {}],
		["on terminate", "L|0,1|0,2|1,2|2,2|3,2|4,2|5,2|6,2|7,2|/terminate", {}]
	];
	
	var _playerParts = [
		["#tb>0",
			'*spew {"source":"C^#path", "x":".x+16", "y":".y+.height", "count":25, "d":[0, 1.5], "lifespan":10, "angle":[1, 2]}',
			{"cooldown":30, "initial":false, "onlyOnce":true}
		],
		["#tb>0",
			'*image {"source":"Iduskwolf:^#path^?w=32;h=32", "x":".x+16", "y":".y+16", "child":{"effect":"spew", "lifespan":10, "dx":0,\
			"dy":0}, "alterU":{"dy":0.5}}',
			{"cooldown":30, "initial":false, "onlyOnce":true}
		],
		["on airjump",
			'*spread {"x":".x+16", "y":".y+.height", "count":50, "d":[0, 1], "lifespan":10, "angle":[0, 1], "dy":0.5, "dylimit":1}',
			{"cooldown":30, "onlyOnce":true}
		]
	];
	
	//Define entities
	entities.types.createNewType("walk", {
		"behaviours":{"BackForth":true, "Persist":true, /*"HitDam":true,*/ "Killable":true, "Gravity":true, "Spawner":true}, 
		"data":{"dx":5, "slowdown":0, "hp":1, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3},
		"animation":_playerAni//, "particles":_playerParts
	}, "plat");
	
	entities.types.createNewType("player", {
		"behaviours":{
			"Persist":true, "PlayerControl":true, "Jumper":true, "MarkTrigger":true, "Killable":true,
			"Gravity":true, "LeftRightControl":true, "Spawner":true, "Scriptable":true, "InteractableHost":true
		},
		"data":{
			"hp":5, "maxHp":5, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3, "hspeed":5,
			"src":"pimg/hero.png tiles:32x32",
			"spawns":{
				"shot":{
					"type":"shot", "horBase":"facing", "verBase":"middle", "cooldown":10,
					"horOffset":1, "controlLimitDx":[0, 0, 60], "applyDx":[[1, 5, 1], [-1, 5, 1]]}, //value, duration, accel, limit
				"slash":{"type":"slash", "horBase":"facing", "cooldown":30, "multDx":[0.5, 10, []],
					"onlyIf":function(e) {return e.dx < 1 && e.dx > -1;},
					"data":[{
						"src":"Example/Slashl.png tiles:32x32"
					}, {
						"src":"Example/Slash.png tiles:32x32"
					}]
				}
			}
		},
		"animation":_playerAni//, "particles":_playerParts
	}, "plat");
	
	entities.types.createNewType("bad", {
		"behaviours":{"HitDam":true},
		"data":{"gravity":0, "damage":1, "types":["electric", "fire"], "src":"pimg/techBad.png tiles:32x32"},
		"animation":[["default", [[0,0], [1,0]], {"trigger":function() {return true}}]]
	}, "plat");
	
	entities.types.createNewType("coin", {
		"behaviours":{"Pickup":true},
		"data":{"gravity":0, "solid":false, "src":"Example/Coin.png tiles:32x32", "collisionOffsetX":8, "collisionOffsetY":8,
			"collisionWidth":26, "collisionHeight":26, "type":"coin",
			"pickupBy":function(e) {return e.entType == "player"}
		},
		"animation":[]
	}, "plat");
	
	entities.types.createNewType("heart", {
		"behaviours":{"Pickup":true, "HealthRestore":true, "Gravity":true},
		"data":{"gravity":1, "terminal":2, "solid":false, "collides": true, "src":"Example/BigHeart.png tiles:32x32",
			"collisionOffsetX":9, "collisionOffsetY":9, "collisionWidth":25, "collisionHeight":25, "type":"heart",
			"pickupHealth":1
		},
		"animation":[]
	}, "plat");
	
	entities.types.createNewType("block", {"behaviours":{}, "data":{"anchor":true, "gravity":0}}, "plat");
	entities.types.createNewType("fall", {"behaviours":{"Fall":true, "InteractableTarget":true}, 
		"data":{"gravity":0, "fallSpeed":3, "src":"pimg/techFallBlock.png tiles:32x32", "interactType":"Falli"},
		"animation":[
			["default", [[0,0]], {"trigger":function() {return true}}],
			["fall", [[1,0]], {"trigger":function(st, ent) {return ent.dy > 0 && !ent.touchers(c.DIR_DOWN).length}}]
		]
	}, "plat");
	entities.types.createNewType("push", {"behaviours":{"Push":true},
		"data":{"gravity":0, "src":"pimg/techFreeMove.png tiles:32x32"}
	}, "plat");
	
	entities.types.createNewType("slash", {"behaviours":{"HitDam":true, "LimitedLife":true},
		"data":{
			"gravity":0, "collides":false, "solid":false, "src":"Example/Slash.png tiles:32x32",
			"damages":function(e) {return e.entType != "player"}, "lifespan":6*5
		},
		"animation":[
			["default", [[0,0],[1,0],[2,0],[3,0],[4,0]], {"trigger":function() {return true}}]
		],
	}, "plat");
	
	entities.types.createNewType("shot", {
		"behaviours":{"HitDam":true, "BackForth":true, "Volatile":true},
		"data":{"solid":false, "src":"Example/Shot.png tiles:32x32", "collisionOffsetX":12, "collisionOffsetY":12,
			"collisionWidth":20, "collisionHeight":20, "hspeed":5, "damages":function(e) {return e.entType != "player"},
			"killedBy":function(e) {return e.entType != "player";}
		},
		"animation":[["default", [[0,0], [1,0]], {"trigger":function() {return true}}]]
	}, "plat");
	
	entities.types.createNewType("checkpoint", {"behaviours":{"InteractableTarget":true, "Checkpoint":true},
		"data":{"gravity":0, "solid":false, "src":"pimg/checkpoint.png tiles:32x32", "interactType":"checkpoint",
			"checkpointName":"plat"
		},
		"animation":[
			["default", [[0,0]], {"trigger":function() {return true}}],
			["active", [[1,0]], {"trigger":function(st, ent) {return ent.eProp("checkpointActive");}}]
		]
	}, "plat");
	
	root.get("hud", "Group").update({
		"xDisplay":"expand",
		"yDisplay":"expand",
		"children":{
			"healthBack":{
				"type":"Grid",
				"hspacing":5,
				"cols":5,
				"rows":1,
				"x":5,
				"y":5,
				"populate":[
					{"type":"Image", "src":"Example/HeartContainer.png", "width":16, "height":16}
				]
			},
			"health":{
				"type":"DynamicGrid",
				"range":plat.health,
				"orientation":c.ORIENT_HOR,
				"hspacing":5,
				"x":5,
				"y":5,
				"populate":[
					{"type":"Image", "src":"Example/Heart.png", "width":16, "height":16}
				]
			},
			"coinIcon":{
				"type":"Tile",
				"width":16,
				"height":16,
				"swidth":32,
				"sheight":32,
				"x":5,
				"y":24,
				"src":"Example/Coin.png tiles:32x32"
			},
			"coinCount":{
				"type":"Label",
				"text":"0",
				"height":22,
				"colour":"#999999",
				"font":"monospace",
				"x":25,
				"y":21
			},
			"lifeIcon":{
				"type":"Tile",
				"width":16,
				"height":16,
				"swidth":16,
				"sheight":16,
				"x":5,
				"y":41,
				"src":"pimg/lives.png"
			},
			"livesCount":{
				"type":"Label",
				"text":"0",
				"height":22,
				"colour":"#999999",
				"font":"monospace",
				"x":25,
				"y":38
			}
		}
	});
	
	/*sgui.get("paused", true).update({
		"visible":false,
		"focus":"controls",
		"children":{
			"pauseText":{
				"type":"Label",
				"text":"Paused",
				"xOrigin":"right",
				"colour":"#0000ff",
			},
			"controls":{
				"type":"Grid",
				"rows":4,
				"cols":1,
				"y":40,
				"x":5,
				"globals":{
					"type":"PlusText",
					"plusType":"ControlConfig",
					"label":{
						"size":12,
					},
					"width":120
				},
				"populate":[
					{"text":"pause", "plus":{"control":"pause"}},
					{"text":"left", "plus":{"control":"entity_left"}},
					{"text":"right", "plus":{"control":"entity_right"}},
					{"text":"jump", "plus":{"control":"entity_jump"}},
				]
			},
		}
	});*/

	root.get("rate", "Group").update({
		"children":{
			"meter":{
				"type":"FpsMeter",
				"yOrigin":"bottom",
				"xOrigin":"right",
			}
		},
		"width":sgui.width,
		"height":sgui.height
	});

	/*dusk.sgui.getPane("ew").update({
		"active":true,
		"children":{
			"ew":{
				"type":"EntityWorkshop",
			}
		},
		"focus":"ew"
	});*/
	
	controls.addControl("entity_spawn_slash", "O", 1, "dvorak");
	controls.addControl("entity_spawn_shot", "E", 2, "dvorak");
	
	var gameActive = true;
	dplatOut.layeredRoom.getPrimaryEntityLayer().onDrop.listen(function(e) {
		var hero = e.entity;
		
		plat.health.value = hero.eProp("hp");
		
		hero.entityEvent.listen(function(e) {
			plat.health.value = hero.eProp("hp");
		}, "damageApplied");
		
		hero.entityEvent.listen(function(e) {
			if(gameActive && !checkpoints.loadCheckpoint("plat", {})) {
				alert("Lol! Game Over!");
				gameActive = false;
				if(root) root.visible = false;	
			}
		}, "terminated");
	}, "player");
	
	frameTicker.onFrame.listen(function(e) {
		if(root.path("hud/coinCount")) root.path("hud/coinCount").text = ""+Pickup.count("coin");
		if(root.path("hud/livesCount")) root.path("hud/livesCount").text = ""+lives;
	}, this);
	
	dusk.onLoad.listen(function (e) {
		dplat.rooms.setRoom("example.plat.rooms.exhall", 0, true);
	});
	
	dusk.startGame();
	
	// Set up checkpoints
	var checkSS = window.checkSS = new SaveSpec("plattest", "Plat Test Checkpoint");
	checkSS.add("dusk.rooms.plat", "roomAndSeek");
	checkSS.add("dusk.entities.behave.Persist", "data", {});
	checkSS.add("dusk.entities.behave.Pickup", "data", {});
	checkSS.add("example.plat", "", {});
	
	checkpoints.set("plat", {
		"loadType":"plat", "saveType":"checkpoint", "priority":0, "spec":checkSS,
		"postLoad":function(e) {lives --; Persist.getPersist("hero").hp = 5;}, "checkLoad":function(e) {return lives > 0;}
	});
	
	var lives = 3;
	
	plat.save = function(type, args, ref) {
		return [ref(lives)];
	}
	
	plat.load = function(data, type, args, unref) {
		lives = unref(data[0]);
	}
	
	return plat;
})());
