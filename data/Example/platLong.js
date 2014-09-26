//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.platLong", (function() {
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
	load.require("dusk.entities.behave.Buoyancy");
	var Pickup = load.require("dusk.entities.behave.Pickup");
	load.require("dusk.entities.behave.HealthRestore");
	var InteractableTarget = load.require("dusk.entities.behave.InteractableTarget");
	
	load.require("dusk.sgui.DynamicGrid");
	load.require("dusk.input.sgui.ControlConfig");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.Image");
	load.require("dusk.particles.particleEffects.core.spread");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.entities.sgui.EntityWorkshop");
	
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
	
	var reversiblePromiseChain = load.require("dusk.utils.reversiblePromiseChain");
	var Scriptable = load.require("dusk.entities.behave.Scriptable");
	
	var platLong = {};
	
	entities.twidth = 32;
	entities.theight = 32;
	entities.swidth = 32;
	entities.sheight = 32;
	
	var _playerAni = [
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
			'*image {"source":"C^#path", "effect":"spew", "count":1, "x":".x+16", "y":".y+16",\
			"lifespan":10, "dx":0, "dy":0,\
			"alterU":{"dy":0.5}}',
			{"cooldown":30, "initial":false, "onlyOnce":true}
		],
		["on airjump",
			'*spread {"x":".x+16", "y":".y+.height", "count":50, "d":[0, 1], "lifespan":10, "angle":[0, 1], "dy":0.5, "dylimit":1}',
			{"cooldown":30, "onlyOnce":true}
		]
	];
	
	//Define entities
	entities.types.createNewType("player", {
		"behaviours":{
			"Persist":true, "PlayerControl":true, "Jumper":true, "MarkTrigger":true, "Killable":true,
			"Gravity":true, "LeftRightControl":true, "Spawner":true, "Scriptable":true, "InteractableHost":true,
			"Buoyancy":true,
		},
		"data":{
			"hp":5, "maxHp":5, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3, "haccel":0.3,
			"hspeed":7, "airhaccelmult":0.5, "fluidhaccelmult":{"water":0.5}, "buoyancy":{"water":2}, "terminalBuoyancy":{"water":7},
			"spawns":{
				"shot":{
					"type":"shot", "horBase":"facing", "verBase":"middle", "cooldown":10,
					"horOffset":1, "controlLimitDx":[[0, 0, 60]]}, //value, duration, accel, limit
				"slash":{"type":"slash", "horBase":"facing", "cooldown":30, "multDx":[0.5, 10, []],
					"onlyIf":"#dx<1 & #dx>-1",
					"data":[{
						"src":"Example/Slashl.png"
					}, {
						"src":"Example/Slash.png"
					}]
				}
			}
		},
		"animation":_playerAni, "particles":_playerParts
	}, "plat");
	
	entities.types.createNewType("slash", {"behaviours":{"HitDam":true},
		"data":{"gravity":0, "collides":false, "solid":false, "src":"Example/Slash.png", "damages":".entType != player"},
		"animation":[
			["", "0,0|1,0|2,0|3,0|4,0|t", {}]
		],
	}, "plat");
	
	entities.types.createNewType("shot", {
		"behaviours":{"HitDam":true, "BackForth":true, "Volatile":true},
		"data":{"solid":false, "src":"Example/Shot.png", "collisionOffsetX":12, "collisionOffsetY":12,
			"collisionWidth":20, "collisionHeight":20, "hspeed":5, "damages":".entType != player",
			"killedBy":".entType != player"
		},
		"animation":[
			["", "0,0|1,0", {}]
		]
	}, "plat");

	sgui.getPane("rate").parseProps({
		"children":{
			"meter":{
				"type":"FpsMeter",
				"yOrigin":c.ORIGIN_MAX,
				"xOrigin":c.ORIGIN_MAX,
			}
		},
		"width":sgui.width,
		"height":sgui.height
	});
	
	controls.addControl("entity_spawn_slash", "O", 1, "dvorak");
	controls.addControl("entity_spawn_shot", "E", 2, "dvorak");
	
	
	dusk.onLoad.listen(function (e) {
		reversiblePromiseChain([
			dplat.rooms.setRoom.bind(dplat.rooms, "example.plat.rooms.long", 0),
			//Scriptable.requestBoundPair("hero", "rawInput", {"inputs":[[30, "right"], [30, "left", "jump"]]}),
		], false, {})
		.then(console.log.bind(console), console.error.bind(console));
	});
	
	dusk.startGame();
	
	return platLong;
})());
