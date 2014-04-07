"use strict";

dusk.load.require("dusk.entities");
dusk.load.require("dusk.behave.BackForth");
dusk.load.require("dusk.behave.GridWalker");
dusk.load.require("dusk.behave.Persist");
dusk.load.require("dusk.behave.MarkTrigger");
dusk.load.require("dusk.behave.StatLoader");

dusk.load.provide("quest.ents");

dusk.entities.swidth = 32;
dusk.entities.sheight = 32;
dusk.entities.twidth = 32;
dusk.entities.theight = 32;
dusk.entities.frameDelay = 10;
dusk.entities.seek = "";
dusk.entities.seekType = "";

dusk.entities.types.createNewType("hero", {
	"behaviours":{
		"Persist":true, "PlayerGridWalker":true, "MarkTrigger":true, "GridWalker":true
	},
	"data":{
		"solid":false,
	}
}, "quest");


dusk.entities.types.createNewType("questTest", {
	"data":{"solid":false, "collides":false, "statsName":"ally"},
	"animation":[],
	"behaviours":{"GridWalker":true, "StatLoader":true}
}, "quest");

dusk.stats.addStatsGenerator("ally", function() {
	var l = new dusk.stats.LayeredStats("ally", "quest.ents");
	
	if(Math.random() < 0.5) {
		l.addBlock(1, "allegiance", {"faction":"ALLY"}, true);
	}else{
		l.addBlock(1, "allegiance", {"faction":"ENEMY"}, true);
	}
	
	return l;
});
