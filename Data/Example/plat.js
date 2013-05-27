//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.plat");
dusk.load.require("dusk.rooms");
dusk.load.require("dusk.entities");
dusk.load.require("dusk.behave.BackForth");
dusk.load.require("dusk.behave.Persist");
dusk.load.require("dusk.behave.HitDam");
dusk.load.require("dusk.behave.Killable");
dusk.load.require("dusk.behave.Controlled");
dusk.load.require("dusk.behave.MarkTrigger");
dusk.load.require("dusk.behave.Fall");
dusk.load.require("dusk.behave.Push");
dusk.load.require("dusk");

dusk.load.require("example.plat.rooms.exhall");
dusk.load.require("example.plat.rooms.rooma");
dusk.load.require("example.plat.rooms.roomb");
dusk.load.require("example.plat.rooms.roomc");
dusk.load.require("example.plat.rooms.roomd");

dusk.load.provide("example.plat");

dusk.entities.tsize = 5;
dusk.entities.ssize = 5;
dusk.entities.twidth = 32;
dusk.entities.theight = 32;
dusk.entities.swidth = 32;
dusk.entities.sheight = 32;
dusk.entities.mode = "BINARY";

example.plat.playerAni = [
	["", "0,0", {}],
	["$dir=l", "0,1", {}],
	["#dx>0", "$dir=r|0,0|1,0|0,0|2,0", {"name":"walkRight"}],
	["#dx<0", "$dir=l|0,1|1,1|0,1|2,1", {}],
	["#dy<0&$dir=r", "3,0", {}],
	["#dy<0&$dir=l", "3,1", {}],
	["#dy>0 & $dir=r & #tb=0", "4,0", {}],
	["#dy>0 & $dir=l & #tb=0", "4,1", {}],
	["on die", "L|0,1|0,2|1,2|2,2|3,2|4,2|5,2|6,2|7,2|!kill", {}]
];

//Define entities
dusk.entities.types.createNewType("walk", {
	"behaviours":{"BackForth":true, "Persist":true, /*"HitDam":true,*/ "Killable":true}, 
	"data":{"dx":5, "slowdown":0, "hp":10, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3},
	"animation":example.plat.playerAni
}, "plat");

dusk.entities.types.createNewType("player", {
	"behaviours":{"Controlled":true, "MarkTrigger":true, "Killable":true},
	"data":{"hp":5, "collisionOffsetX":10, "collisionWidth":22, "collisionOffsetY":3},
	"animation":example.plat.playerAni
}, "plat");

dusk.entities.types.createNewType("bad", {
	"behaviours":{"HitDam":true},
	"data":{"gravity":0, "damage":1, "types":["electric", "fire"], "img":"pimg/techBad.png"},
	"animation":[["", "0,0|1,0|+30", {}]]
}, "plat");

dusk.entities.types.createNewType("block", {"behaviours":{}, "data":{"anchor":true, "gravity":0}}, "plat");
dusk.entities.types.createNewType("fall", {"behaviours":{"Fall":true}, 
	"data":{"gravity":0, "fallSpeed":3, "img":"pimg/techFallBlock.png"},
	"animation":[["", "0,0", {}], ["#dy>0 & #tb=0", "1,0", {}]]
}, "plat");
dusk.entities.types.createNewType("push", {"behaviours":{"Push":true},
	"data":{"gravity":0, "img":"pimg/techFreeMove.png"}
}, "plat");

dusk.plat.becomeRoomManager();

dusk.onLoad.listen(function (e){dusk.rooms.setRoom("exhall", 0);}, this);

dusk.startGame();
