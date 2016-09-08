"use strict";

load.provide("quest.entities", function() {
	var entities = load.require("dusk.entities");
	load.require("dusk.entities.behave.BackForth");
	load.require("dusk.entities.behave.GridWalker");
	load.require("dusk.entities.behave.PlayerGridWalker");
	load.require("dusk.entities.behave.GridMouse");
	load.require("dusk.entities.behave.Persist");
	load.require("dusk.entities.behave.MarkTrigger");
	load.require("dusk.stats.behave.StatLoader");
	var items = load.require("dusk.items");
	var stats = load.require("dusk.stats");
	var store = load.require("dusk.stats.store");
	var at = load.require("dusk.tiles.sgui.extras.animationTypes");
	
	
	// Entities
	entities.twidth = 32;
	entities.theight = 32;
	entities.seek = "";
	entities.seekType = "";
	
	entities.types.createNewType("hero", {
		"behaviours":{
			"Persist":true, "PlayerGridWalker":true, "MarkTrigger":true, "GridWalker":true
		},
		"data":{
			"solid":false
		}
	}, "quest");
	
	
	entities.types.createNewType("questTest", {
		"data":{
			"solid":false, "collides":false, "statsName":"ally", "statsLoadImage":true, "statsPutBack":true,
			"animationRate":20,
		},
		"animation":[
			["default", [
				at.setTile(1,2), at.setTile(2,2), at.setTile(1,2), at.setTile(3,2)
			], {"trigger":function(){return true;}}],
			
			["waiting", [at.addTrans("mono")],
				{"unsettable":true, "trigger":function(s, e) {return e.stats.get("moved")}, "waitFalse":true}
			],
			
			["notWaiting", [at.removeTrans("mono")],
				{"unsettable":true, "trigger":function(s, e) {return !e.stats.get("moved")}, "waitFalse":true}
			],
			["on panic", "2,2|3,2|2,2|3,2|2,2|/panic", {}]
		],
		"particles":[["stat(moved, 3)", "#+mono", {}], ["!stat(moved, 3)", "#-mono", {}]],
		"behaviours":{"GridWalker":true, "StatLoader":true}
	}, "quest");
	
	entities.types.createNewType("questEvil", {
		"data":{
			"solid":false, "collides":false, "statsName":"evil", "statsLoadImage":true,
			"animationRate":20,
		},
		"animation":[["default", [
				at.setTile(1,3), at.setTile(2,3), at.setTile(1,3), at.setTile(3,3)
				], {"trigger":function(){return true;}}
			]
		],
		"particles":[["stat(moved, 3)", "#+mono", {}], ["!stat(moved, 3)", "#-mono", {}]],
		"behaviours":{"GridWalker":true, "StatLoader":true}
	}, "quest");
	
	
	
	// Stats
	var _basic = function(l) {
		l.layer(1).addBlock("baseRange", {"possibleRange":[], "vis":2});
		l.layer(1).addBlock("initialMoved", {"moved":false});
		
		var inv = new items.Invent(4, "1", 1);
		l.layer(2).addBlock("weapons", inv);
		if(Math.random() > 0.3) inv.addItem("sword");
		if(Math.random() > 0.3) inv.addItem("bow");
		if(Math.random() > 0.3) inv.addItem("theLongblade");
		if(Math.random() > 0.3) inv.addItem("snipersBow");
		
		if(Math.random() > 0.5) {
			l.layer(1).addBlock("image", {"image":"Quest/images/shaman.png tiles:32x32"});
			l.layer(1).addBlock("class", {"move":5});
		}else if(Math.random() > 0.5){
			l.layer(1).addBlock("image", {"image":"Quest/images/knight.png tiles:32x32"});
			l.layer(1).addBlock("class", {"move":3});
		}else{
			l.layer(1).addBlock("image", {"image":"Quest/images/dino.png tiles:32x32"});
			l.layer(1).addBlock("class", {"move":6});
		}
	};
	
	store.addGenerator("evil", function() {
		var l = new stats.LayeredStats("evil", "quest.entities");
		
		_basic(l);
		
		l.layer(1).addBlock("allegiance", {"faction":"ENEMY"}, true);
		
		return l;
	});
	
	store.addGenerator("ally", function() {
		var l = new stats.LayeredStats("ally", "quest.entities");
		
		_basic(l);
		
		l.layer(1).addBlock("allegiance", {"faction":"ALLY"}, true);
		
		return l;
	});
	
	
	
	//Items
	items.items.createNewType("weapon", {
		"weapon":true,
		"stats":{
			"possibleRange_mod":
				"(concat (list (list \
					(getf (get layeredstats-block 'item') 'minRange') \
					(getf (get layeredstats-block 'item') 'maxRange')\
				)))"
			//"possibleRange":"X @ sl ((block.item).minRange, (block.item).maxRange)",
		}
	});
	
	items.items.createNewType("bow", {
		"minRange":2, "maxRange":2, "displayName":"[img Quest/images/bow.png][/img] Bow"
	}, "weapon");
	items.items.createNewType("sword", {
		"minRange":1, "maxRange":1, "displayName":"[img Quest/images/sword.png][/img] Sword"
	}, "weapon");
	items.items.createNewType("theLongblade", {
		"minRange":1, "maxRange":2, "displayName":"[img Quest/images/sword.png][/img] The Longblade"
	}, "weapon");
	items.items.createNewType("snipersBow", {
		"minRange":10, "maxRange":10, "displayName":"[img Quest/images/bow.png][/img] Sniper's Bow"
	}, "weapon");
});
