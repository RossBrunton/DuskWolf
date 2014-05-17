"use strict";

load.provide("quest", (function() {
	load.require("dusk.sgui.FancyRect");
	load.require("dusk.sgui.Grid");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.FocusChecker");
	load.require("dusk.sgui.extras.MatchedSize");
	load.require("dusk.sgui.FpsMeter");
	
	var dusk = load.require("dusk");
	var items = load.require("dusk.items");
	var save = load.require("dusk.save");
	var ConsoleSource = load.require("dusk.save.ConsoleSource");
	var TurnTicker = load.require("dusk.TurnTicker");
	var c = load.require("dusk.sgui.c");
	var dquest = load.require("dusk.quest");
	var sgui = load.require("dusk.sgui");
	var TileMapWeights = load.require("dusk.sgui.TileMapWeights");
	var reversiblePromiseChain = load.require("dusk.reversiblePromiseChain");

	var ents = load.require("quest.ents");
	load.require("quest.rooms.rooma");
	
	var quest = {};
	
	dusk.onLoad.listen(function (e){dquest.rooms.setRoom("quest.rooms.rooma", 0);});

	//Test
	sgui.getPane("menu").parseProps({
	   "children":{
			"back":{
				"type":"FancyRect",
				"width":0,
				"height":0,
				"x":50,
				"y":50,
				"back":"fancyRect/back.png",
				"top":"fancyRect/top.png",
				"bottom":"fancyRect/bottom.png",
				"left":"fancyRect/left.png",
				"right":"fancyRect/right.png",
				"topLeft":"fancyRect/topLeft.png",
				"topRight":"fancyRect/topRight.png",
				"bottomLeft":"fancyRect/bottomLeft.png",
				"bottomRight":"fancyRect/bottomRight.png",
				"radius":2,
				"extras":{
					"size":{
						"type":"MatchedSize",
						"paddingTop":10,
						"paddingBottom":10,
						"paddingRight":10,
						"paddingLeft":10,
						"base":"../menu",
					}
				}
			},
			"menu":{
				"type":"Grid",
				"globals":{
					"type":"PlusText",
					"plusType":"FocusCheckerRect",
					"behind":true,
					"mouse":true,
					"label":{
						"colour":"#cccccc",
						"size":16
					},
					"plus":{
						"width":150,
						"height":24,
						"active":"",
						"focused":"",
						"inactive":"",
						"colour":"",
						"bInactive":"#000000",
						"bFocused":"#000000",
						"bActive":"#999900",
						"bwActive":3,
						"radius":3
					}
				},
				"x":50,
				"y":50,
				"hspacing":5,
				"visible":false
			}
		}
	});

	sgui.getPane("menu").parseProps({
		"children":{
			"meter":{
				"type":"FpsMeter",
				"xOrigin":c.ORIGIN_MAX,
				"yOrigin":c.ORIGIN_MAX
			},
		}
	});

	/*dusk.sgui.getPane("test").parseProps({
		"active":true,
		"focus":"text",
		"children":{
			"text":{
				"type":"Grid",
				"rows":1,
				"cols":5,
				"x":100,
				"y":100,
				"populate":{
					"type":"TextBox",
					"width":200,
					"height":200,
					"mouse":true,
					"padding":5,
					"multiline":true,
					"format":true,
				}
			},
		}
	});*/

	window.q = dquest.puppeteer;
	
	var _move = function(arg, qu) {
		var t = dusk.utils.clone(targ);
		t.region = "r"+Math.random();
		t.opts.forEach[0].name = t.region+"_attack";
		
		qu(q.requestBoundPair("getSeek", {})); qu(q.requestBoundPair("generateRegion", t));
		qu(q.requestBoundPair("getTilePathInRange", {"colour":"#999999"}));
		qu(q.requestBoundPair("moveViaPath"));
		qu(q.requestBoundPair("uncolourRegion", {"regions":[t.region+"_attack", t.region, t.region+"_path"]}));
	}

	window.aarg =
		{"name":"attack", "region":"attackAM", "colour":"#990000", "los":true, "entFilter":"stat(faction, 1) = ENEMY"};
	window.targ = 
		{"region":"r", "los":true, "forEach":[aarg], "colour":"#000099", "entBlock":"stat(faction, 1) = ENEMY"};

	var _turns = new TurnTicker();

	quest.allyTurnInner = function() {
		return reversiblePromiseChain([
			q.requestBoundPair("selectEntity", 
				{"allowNone":true, "filter":"stat(faction, 1) = ALLY & stat(moved, 3) = false"}
			),
			function(passedArg, qu) {
				if(!passedArg.entity) {
					qu(q.requestBoundPair("selectListMenu", {"path":"menu:/menu"}));
					qu(reversiblePromiseChain.STOP);
					
					passedArg.options = [];
					
					passedArg.options.push({"text":"End", "listSelectValue":"test", "listSelectFunction":function(pa, qu) {
						pa.endTurn = true;
						return pa;
					}});
					passedArg.options.push({"text":"Cancel", "listSelectCancel":true});
					
					return passedArg;
				}else{
					var ranges = passedArg.entity.stats.get("possibleRange", 2);
					var rmap = [];
					
					for(var i = 0; i < ranges.length; i ++) {
						for(var a = ranges[i][0]; a <= ranges[i][1]; a ++) {
							rmap[a] = true;
						}
					}
					
					aarg.rangeMap = rmap;
					passedArg.aarg = aarg;
					targ.forEach[0] = aarg;
					passedArg.range = passedArg.entity.stats.get("move", 1);
					
					return passedArg;
				}
			},
			q.requestBoundPair("generateRegion", targ),
			q.requestBoundPair("getTilePathInRange", {"colour":":default/arrows32.png"}),
			q.requestBoundPair("moveViaPath"),
			q.requestBoundPair("uncolourRegion", {"regions":["attack", targ.region, targ.region+"_path"]}),
			q.requestBoundPair("generateRegion", aarg),
			function(pa) {
				pa.options = [];
				
				pa.mover = pa.entity;
				
				console.log("Generate Options");
				
				//Attack option
				if(pa.regionEntities.length) {
					pa.options.push({"text":"Attack!", "listValue":"attack", "listSelectFunction":function(pa, qu) {
						qu(q.requestBoundPair("selectEntity", {"filter":"stat(faction, 1) = ENEMY", "region":"attackAM"}));
						qu(function(pa) {
							console.log(pa.entity);
							pa.entity.terminate();
							
							return pa;
						});
						
						return pa;
					}});
				}
				
				//Items option
				pa.options.push({"text":"Items", "listValue":"items", "listSelectFunction":function(pa, qu) {
					qu(function(pa) {
						pa.options = [];
						var i = pa.entity.stats.getBlock(2, "weapons");
						i.forEach(function(item, slot) {
							pa.options.push({"text":item.get("displayName"), "listValue":item.type});
						});
						
						return pa;
					});
					qu(q.requestBoundPair("selectListMenu", {"path":"menu:/menu"}));
					
					return pa;
				}});
				
				//Wait option
				pa.options.push({"text":"Wait", "listValue":"wait"});
				
				//Cancel option
				pa.options.push({"text":"Cancel", "listSelectCancel":true});
				
				return pa;
			},
			q.requestBoundPair("selectListMenu", {"path":"menu:/menu"}),
			q.requestBoundPair("uncolourRegion", {"regions":["attackAM"]}),
			function(pa) {
				pa.mover.stats.addBlock(3, "moved", {"moved":true});
				
				return pa;
			}
		], false)
	//	.then(console.log.bind(console), console.error.bind(console))
		.then(function(pa) {
			if(!pa.endTurn) {
				return quest.allyTurnInner();
			}else{
				return pa;
			}
		});
	};

	quest.allyTurn = function() {
		return new Promise(function(oFulfill, oReject) {
			quest.allyTurnInner()
			.then(function(pa) {
				var ents = q.getBasicMain().getPrimaryEntityLayer().filter("stat(moved, 3)");
				
				for(var i = 0; i < ents.length; i ++) {
					ents[i].stats.removeBlock(3, "moved");
				}
				
				oFulfill(true);
			});
		});
	}

	quest.enemyTurn = function() {
		return Promise.resolve(true);
	};

	targ.weights = new TileMapWeights(2, 10);
	targ.weights.addWeight(1, 0, 100);
	targ.weights.addWeight(2, 0, 100);

	targ.forEach[0].weights = new TileMapWeights(2, 10);
	targ.forEach[0].weights.addWeight(1, 0, 100);

	dusk.startGame();
	//quest.go();

	_turns.register("ally", quest.allyTurn);
	_turns.register("enemy", quest.enemyTurn);
	_turns.start();

	window.ss = new save.SaveSpec("ss", "ss");
	ss.add("dusk.stats", "stats", {});
	
	return quest;
})());
