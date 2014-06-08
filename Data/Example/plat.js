//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.plat", (function() {
	load.require("dusk.behave.HitDam");
	load.require("dusk.behave.Killable");
	load.require("dusk.behave.PlayerControl");
	load.require("dusk.behave.Jumper");
	load.require("dusk.behave.Spawner");
	load.require("dusk.behave.MarkTrigger");
	load.require("dusk.behave.Volatile");
	var Persist = load.require("dusk.behave.Persist");
	load.require("dusk.behave.BackForth");
	load.require("dusk.behave.Fall");
	load.require("dusk.behave.Push");
	load.require("dusk.behave.Gravity");
	var Pickup = load.require("dusk.behave.Pickup");
	load.require("dusk.behave.HealthRestore");
		
	load.require("dusk.sgui.DynamicGrid");
	load.require("dusk.sgui.ControlConfig");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.Image");
	load.require("dusk.sgui.effects.spread");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.EntityWorkshop");
	
	var dplat = load.require("dusk.plat");
	var entities = load.require("dusk.entities");
	var dusk = load.require("dusk");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var controls = load.require("dusk.controls");
	var frameTicker = load.require("dusk.frameTicker");
	var Range = load.require("dusk.Range");

	load.require("example.plat.rooms.exhall");
	
	var plat = {};
	
	entities.twidth = 32;
	entities.theight = 32;
	entities.swidth = 32;
	entities.sheight = 32;
	
	plat.health = new Range(0, 5, 0);

	var _playerAni = [
		["true", "0,0", {}],
		[":lastMoveLeft", "0,1", {}],
		["#dx>0", '0,0|1,0|0,0|2,0', {"name":"walkRight"}],
		["#dx<0", "0,1|1,1|0,1|2,1", {}],
		["#dy<0", "3,0", {}],
		["#dy<0 & :lastMoveLeft=true", "3,1", {}],
		["#dy>0 & #tb=0", "4,0", {}],
		["#dy>0 & :lastMoveLeft=true & #tb=0", "4,1", {}],
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
	entities.types.createNewType("walk", {
		"behaviours":{"BackForth":true, "Persist":true, /*"HitDam":true,*/ "Killable":true, "Gravity":true, "Spawner":true}, 
		"data":{"dx":5, "slowdown":0, "hp":1, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3},
		"animation":_playerAni, "particles":_playerParts
	}, "plat");

	entities.types.createNewType("player", {
		"behaviours":{
			"Persist":true, "PlayerControl":true, "Jumper":true, "MarkTrigger":true, "Killable":true,
			"Gravity":true, "LeftRightControl":true, "Spawner":true
		},
		"data":{
			"hp":5, "maxHp":5, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3, "hspeed":5,
			"spawns":{
				"shot":{
					"type":"shot", "horBase":"facing", "verBase":"middle", "cooldown":10,
					"horOffset":1, "multDx":[[0.5, 10, []]], "applyDx":[[1, 5], [-1, 5]]}, //value, duration, accel, limit
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

	entities.types.createNewType("bad", {
		"behaviours":{"HitDam":true},
		"data":{"gravity":0, "damage":1, "types":["electric", "fire"], "src":"psrc/techBad.png"},
		"animation":[["", "0,0|1,0|+30", {}]]
	}, "plat");

	entities.types.createNewType("coin", {
		"behaviours":{"Pickup":true},
		"data":{"gravity":0, "solid":false, "src":"Example/Coin.png", "collisionOffsetX":8, "collisionOffsetY":8,
			"collisionWidth":26, "collisionHeight":26, "type":"coin", "pickupBy":".entType=player"
		},
		"animation":[]
	}, "plat");

	entities.types.createNewType("heart", {
		"behaviours":{"Pickup":true, "HealthRestore":true, "Gravity":true},
		"data":{"gravity":1, "terminal":2, "solid":false, "collides": true, "src":"Example/BigHeart.png",
			"collisionOffsetX":9, "collisionOffsetY":9, "collisionWidth":25, "collisionHeight":25, "type":"heart",
			"pickupHealth":1
		},
		"animation":[]
	}, "plat");

	entities.types.createNewType("block", {"behaviours":{}, "data":{"anchor":true, "gravity":0}}, "plat");
	entities.types.createNewType("fall", {"behaviours":{"Fall":true}, 
		"data":{"gravity":0, "fallSpeed":3, "src":"pimg/techFallBlock.png"},
		"animation":[["", "0,0", {}], ["#dy>0 & #tb=0", "1,0", {}]]
	}, "plat");
	entities.types.createNewType("push", {"behaviours":{"Push":true},
		"data":{"gravity":0, "src":"psrc/techFreeMove.png"}
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


	sgui.getPane("hud").parseProps({
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
				"src":"Example/Coin.png"
			},
			"coinCount":{
				"type":"Label",
				"text":"0",
				"height":22,
				"colour":"#999999",
				"font":"monospace",
				"x":25,
				"y":21
			}
		}
	});

	sgui.getPane("paused").parseProps({
		"visible":false,
		"focus":"controls",
		"children":{
			"pauseText":{
				"type":"Label",
				"text":"Paused",
				"xOrigin":c.ORIGIN_MAX,
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
	});

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

	/*dusk.sgui.getPane("ew").parseProps({
		"active":true,
		"children":{
			"ew":{
				"type":"EntityWorkshop",
			}
		},
		"focus":"ew"
	});*/

	controls.addControl("entity_spawn_slash", 79, 1);
	controls.addControl("entity_spawn_shot", 69, 2);

	frameTicker.onFrame.listen(function(e) {
		if(Persist.getPersist("hero")) {
			plat.health.value = Persist.getPersist("hero").hp;
		}
		if(sgui.path("hud:/coinCount")) sgui.path("hud:/coinCount").text = ""+Pickup.count("coin");
	}, this);

	dusk.onLoad.listen(function (e){dplat.rooms.setRoom("example.plat.rooms.exhall", 0);}.bind(this));

	dusk.startGame();
	
	return plat;
})());
