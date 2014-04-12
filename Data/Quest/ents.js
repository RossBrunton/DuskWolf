"use strict";

dusk.load.require("dusk.entities");
dusk.load.require("dusk.behave.BackForth");
dusk.load.require("dusk.behave.GridWalker");
dusk.load.require("dusk.behave.Persist");
dusk.load.require("dusk.behave.MarkTrigger");
dusk.load.require("dusk.behave.StatLoader");
dusk.load.require("dusk.items");

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
	"data":{"solid":false, "collides":false, "statsName":"ally", "statsLoadImage":true, "statsPutBack":true},
	"animation":[],
	"behaviours":{"GridWalker":true, "StatLoader":true}
}, "quest");

dusk.stats.addStatsGenerator("ally", function() {
	var l = new dusk.stats.LayeredStats("ally", "quest.ents");
	
	quest.ents.basic(l);
	
	l.addBlock(1, "allegiance", {"faction":"ALLY"}, true);
	l.addBlock(1, "image", {"image":"pimg/hero.png"});
	
	return l;
});

dusk.entities.types.createNewType("questEvil", {
	"data":{"solid":false, "collides":false, "statsName":"evil", "statsLoadImage":true},
	"animation":[["true", "0,1", {}]],
	"behaviours":{"GridWalker":true, "StatLoader":true}
}, "quest");

dusk.stats.addStatsGenerator("evil", function() {
	var l = new dusk.stats.LayeredStats("evil", "quest.ents");
	
	quest.ents.basic(l);
	
	l.addBlock(1, "allegiance", {"faction":"ENEMY"}, true);
	l.addBlock(1, "image", {"image":"Quest/evil.png"});
	
	return l;
});

quest.ents.basic = function(l) {
	l.addBlock(1, "baseRange", {"possibleRange":[]});
	
	var inv = new dusk.items.Invent(4, "item.weapon", 1);
	l.addBlock(2, "weapons", inv);
	if(Math.random() > 0.3) inv.addItem("sword");
	if(Math.random() > 0.3) inv.addItem("bow");
	if(Math.random() > 0.3) inv.addItem("theLongblade");
	if(Math.random() > 0.3) inv.addItem("snipersBow");
};

//Items
dusk.items.items.createNewType("weapon", {
	"weapon":true,
	"stats":{
		"possibleRange_mod":"X @ sl ((block.item) . minRange, (block.item).maxRange)",
	}
});

dusk.items.items.createNewType("bow", {"minRange":2, "maxRange":2, "displayName":"Bow"}, "weapon");
dusk.items.items.createNewType("sword", {"minRange":1, "maxRange":1, "displayName":"Sword"}, "weapon");
dusk.items.items.createNewType("theLongblade", {"minRange":1, "maxRange":2, "displayName":"The Longblade"}, "weapon");
dusk.items.items.createNewType("snipersBow", {"minRange":10, "maxRange":10, "displayName":"Sniper's Bow"}, "weapon");
