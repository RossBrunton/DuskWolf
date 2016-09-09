//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.ike", function() {
	var stats = load.require("dusk.stats");
	var store = load.require("dusk.stats.store");
	var SaveSpec = load.require("dusk.save.SaveSpec");
	window.save = load.require("dusk.save");
	window.LocalStorageSource = load.require("dusk.save.sources.LocalStorageSource");
	window.items = load.require("dusk.items");
	window.Invent = load.require("dusk.items.Inventory");
	
	var ranger = {
		"hp_max":40,
		"str_max":20,
		"mag_max":15,
		"skill_max":20,
		"spd_max":20,
		"luck_max":40,
		"def_max":20,
		"res_max":20
	};
	
	var lord = {
		"hp_max":60,
		"str_max":26,
		"mag_max":20,
		"skill_max":27,
		"spd_max":28,
		"luck_max":40,
		"def_max":24,
		"res_max":22
	};
	
	var init = {
		"hp_min":0,
		"str_min":0,
		"mag_min":0,
		"skill_min":0,
		"spd_min":0,
		"luck_min":0,
		"def_min":0,
		"res_min":0
	};
	
	var initStats = {
		"hp":19,
		"str":5,
		"mag":1,
		"skill":6,
		"spd":7,
		"luck":6,
		"def":5,
		"res":0
	};
	
	var growths = {
		"hp":0.75,
		"str":0.50,
		"mag":0.20,
		"skill":0.50,
		"spd":0.55,
		"luck":0.35,
		"def":0.40,
		"res":0.40
	};
	
	var promGains = {
		"hp_add":4,
		"str_add":3,
		"mag_add":2,
		"skill_add":2,
		"spd_add":2,
		"def_add":3,
		"res_add":2
	};
	
	store.addGenerator("fe_character", function(level) {
		var ls = new stats.LayeredStats("fe_character", "ike",
			["base", "starting_stats", "class_1", "levels_1", "class_2", "levels_2", "items"]
		);
		ls.setExtra("level", level);
		ls.layer("base").addBlock("init", init);
		return ls;
	});
	
	window.ike = store.getGenerator("fe_character")(1);
	ike.layer("class_1").addBlock("ranger", ranger);
	ike.layer("starting_stats").addBlock("starting_stats", initStats);
	
	window.levelUp = function() {
		ike.setExtra("level", ike.getExtra("level") + 1);
		
		if(ike.getExtra("level") == 21) {
			console.log("Class Change!");
			
			ike.layer("class_2").addBlock("new_class", lord);
			ike.layer("class_2").addBlock("promotion_gains", promGains);
		}else{
			console.log("Level Up! Now level "+ike.getExtra("level")+"!");
			
			var level = {};
			for(var p in growths) {
				if(Math.random() < growths[p]) {
					console.log(p+" up!");
					level[p+"_add"] = 1;
				}
			}
			
			if(ike.getExtra("level") > 20) {
				ike.layer("levels_2").addBlock("level_"+ike.getExtra("level"), level);
			}else{
				ike.layer("levels_1").addBlock("level_"+ike.getExtra("level"), level);
			}
		}
		
	}
	
	store.addStats("ike", ike);
	window.ikeSpec = new SaveSpec("ike", "Ike Data");
	window.ikeSpec.add("dusk.stats.store", "stats", {});
	
	window.ikeSave = function() {
		save.save(ikeSpec, new LocalStorageSource(), "ike_test").then(console.log.bind(console));
	};
	
	window.ikeLoad = function() {
		save.load(ikeSpec, new LocalStorageSource(), "ike_test").then(function(v) {
			console.log(v)
			window.ike = store.getStats("ike");
		});
	};
	
	items.items.createNewType("ragnel", {"stats":{"def":"(+ 5)"}});
	
	window.ikeInvent = new Invent(1, "1", 1);
	ike.layer("items").addBlock("invent", ikeInvent);
	
	return undefined;
});
