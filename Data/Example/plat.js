//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.plat");
dusk.load.require("dusk.entities");
dusk.load.require("dusk.behave.BackForth");
dusk.load.require("dusk.behave.Persist");
dusk.load.require("dusk.behave.HitDam");
dusk.load.require("dusk.behave.Killable");
dusk.load.require("dusk.behave.PlayerControl");
dusk.load.require("dusk.behave.Jumper");
dusk.load.require("dusk.behave.Spawner");
dusk.load.require("dusk.behave.MarkTrigger");
dusk.load.require("dusk.behave.Volatile");
dusk.load.require("dusk.sgui.DynamicGrid");
dusk.load.require("dusk.sgui.ControlConfig");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.sgui.Image");
dusk.load.require("dusk.behave.Fall");
dusk.load.require("dusk.behave.Push");
dusk.load.require("dusk.behave.Gravity");
dusk.load.require("dusk.behave.Pickup");
dusk.load.require("dusk.behave.HealthRestore");
dusk.load.require("dusk");
dusk.load.require("dusk.sgui.effects.spread");
dusk.load.require("dusk.sgui.FpsMeter");
dusk.load.require("dusk.sgui.PlusText");
dusk.load.require("dusk.sgui.EntityWorkshop");

dusk.load.require("example.plat.rooms.exhall");

dusk.load.provide("example.plat");

dusk.entities.twidth = 32;
dusk.entities.theight = 32;
dusk.entities.swidth = 32;
dusk.entities.sheight = 32;

example.plat.health = new dusk.Range(0, 5, 0);

example.plat.playerAni = [
	["", "0,0", {}],
	[":lastMoveLeft=true", "0,1", {}],
	["#dx>0", '0,0|1,0|0,0|2,0', {"name":"walkRight"}],
	["#dx<0", "0,1|1,1|0,1|2,1", {}],
	["#dy<0", "3,0", {}],
	["#dy<0 & :lastMoveLeft=true", "3,1", {}],
	["#dy>0 & #tb=0", "4,0", {}],
	["#dy>0 & :lastMoveLeft=true & #tb=0", "4,1", {}],
	["on beh_terminate", "L|0,1|0,2|1,2|2,2|3,2|4,2|5,2|6,2|7,2|/terminate", {}]
];

example.plat.playerParts = [
	["#tb>0",
		'*spew {"source":"C.#path", "x":".x+16", "y":".y+.height", "count":25, "d":[0, 1.5], "lifespan":10, "angle":[1, 2]}',
		{"cooldown":30, "initial":false, "onlyOnce":true}
	],
	["#tb>0",
		'*image {"source":"C.#path", "effect":"spew", "count":1, "x":".x+16", "y":".y+16",\
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
dusk.entities.types.createNewType("walk", {
	"behaviours":{"BackForth":true, "Persist":true, /*"HitDam":true,*/ "Killable":true}, 
	"data":{"dx":5, "slowdown":0, "hp":1, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3},
	"animation":example.plat.playerAni, "particles":example.plat.playerParts
}, "plat");

dusk.entities.types.createNewType("player", {
	"behaviours":{
		"Persist":true, "PlayerControl":true, "Jumper":true, "MarkTrigger":true, "Killable":true,
		"Gravity":true, "LeftRightControl":true, "Spawner":true
	},
	"data":{
		"hp":5, "maxHp":5, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3, "hspeed":5,
		"spawns":{
			"shot":{"type":"shot", "horBase":"facing", "verBase":"middle", "cooldown":10, "horOffset":1},
			"slash":{"type":"slash", "horBase":"facing", "cooldown":30, "data":[{
				"img":"Example/Slashl.png"
			}, {
				"img":"Example/Slash.png"
			}]}
		}
	},
	"animation":example.plat.playerAni, "particles":example.plat.playerParts
}, "plat");

dusk.entities.types.createNewType("bad", {
	"behaviours":{"HitDam":true},
	"data":{"gravity":0, "damage":1, "types":["electric", "fire"], "img":"pimg/techBad.png"},
	"animation":[["", "0,0|1,0|+30", {}]]
}, "plat");

dusk.entities.types.createNewType("coin", {
	"behaviours":{"Pickup":true},
	"data":{"gravity":0, "solid":false, "img":"Example/Coin.png", "collisionOffsetX":8, "collisionOffsetY":8,
		"collisionWidth":26, "collisionHeight":26, "type":"coin", "pickupBy":".entType=player"
	},
	"animation":[]
}, "plat");

dusk.entities.types.createNewType("heart", {
	"behaviours":{"Pickup":true, "HealthRestore":true, "Gravity":true},
	"data":{"gravity":1, "terminal":2, "solid":false, "collides": true, "img":"Example/BigHeart.png",
		"collisionOffsetX":9, "collisionOffsetY":9, "collisionWidth":25, "collisionHeight":25, "type":"heart",
		"pickupHealth":1
	},
	"animation":[]
}, "plat");

dusk.entities.types.createNewType("block", {"behaviours":{}, "data":{"anchor":true, "gravity":0}}, "plat");
dusk.entities.types.createNewType("fall", {"behaviours":{"Fall":true}, 
	"data":{"gravity":0, "fallSpeed":3, "img":"pimg/techFallBlock.png"},
	"animation":[["", "0,0", {}], ["#dy>0 & #tb=0", "1,0", {}]]
}, "plat");
dusk.entities.types.createNewType("push", {"behaviours":{"Push":true},
	"data":{"gravity":0, "img":"pimg/techFreeMove.png"}
}, "plat");

dusk.entities.types.createNewType("slash", {"behaviours":{"HitDam":true},
	"data":{"gravity":0, "collides":false, "solid":false, "img":"Example/Slash.png", "damages":".entType != player"},
	"animation":[
		["", "0,0|1,0|2,0|3,0|4,0|t", {}]
	],
}, "plat");

dusk.entities.types.createNewType("shot", {
	"behaviours":{"HitDam":true, "BackForth":true, "Volatile":true},
	"data":{"solid":false, "img":"Example/Shot.png", "collisionOffsetX":12, "collisionOffsetY":12,
		"collisionWidth":20, "collisionHeight":20, "hspeed":5, "damages":".entType != player",
	},
	"animation":[
		["", "0,0|1,0", {}]
	]
}, "plat");

dusk.sgui.getPane("hud").parseProps({
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
			"range":example.plat.health,
			"orientation":dusk.sgui.c.ORIENT_HOR,
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

dusk.sgui.getPane("paused").parseProps({
	"visible":false,
	"focus":"controls",
	"children":{
		"pauseText":{
			"type":"Label",
			"text":"Paused",
			"xOrigin":dusk.sgui.Component.ORIGIN_MAX,
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

dusk.sgui.getPane("rate").parseProps({
	"children":{
		"meter":{
			"type":"FpsMeter",
			"yOrigin":dusk.sgui.Component.ORIGIN_MAX,
			"xOrigin":dusk.sgui.Component.ORIGIN_MAX,
		}
	},
	"width":dusk.sgui.width,
	"height":dusk.sgui.height
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

dusk.controls.addControl("entity_spawn_slash", 79, 1);
dusk.controls.addControl("entity_spawn_shot", 69, 2);

dusk.frameTicker.onFrame.listen(function(e) {
	if(dusk.behave.Persist.getPersist("hero")) {
		example.plat.health.value = dusk.behave.Persist.getPersist("hero").hp;
	}
	if(dusk.sgui.path("hud:/coinCount")) dusk.sgui.path("hud:/coinCount").text = ""+dusk.behave.Pickup.count("coin");
}, this);

dusk.onLoad.listen(function (e){dusk.plat.rooms.setRoom("exhall", 0);}, this);

dusk.startGame();
