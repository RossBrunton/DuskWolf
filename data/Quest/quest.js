"use strict";

load.provide("quest", (function() {
	load.require("dusk.sgui.FancyRect");
	load.require("dusk.sgui.Grid");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.FocusChecker");
	load.require("dusk.sgui.extras.MatchedSize");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.Feed");
	
	load.require("dusk.sgui.extras.Die");
	load.require("dusk.sgui.extras.Fade");
	
	var dusk = load.require("dusk");
	var items = load.require("dusk.items");
	var SaveSpec = load.require("dusk.save.SaveSpec");
	var ConsoleSource = load.require("dusk.save.sources.ConsoleSource");
	var TurnTicker = load.require("dusk.TurnTicker");
	var c = load.require("dusk.sgui.c");
	var dquest = load.require("dusk.rooms.quest");
	var sgui = load.require("dusk.sgui");
	var TileMapWeights = load.require("dusk.tiles.sgui.TileMapWeights");
	var reversiblePromiseChain = load.require("dusk.utils.reversiblePromiseChain");
	
	var ents = load.require("quest.ents");
	load.require("quest.rooms.rooma");
	
	var quest = {};
	
	dusk.onLoad.listen(function (e){
		dquest.rooms.setRoom("quest.rooms.rooma", 0).then((function(e) {
			_turns.register("ally", quest.allyTurn);
			_turns.register("enemy", quest.enemyTurn);
			_turns.start();
		}).bind(this));
	});
	
	var root = sgui.get("default", true);
	dquest.make(root, "quest");
	
	//Test
	root.get("menu", "Group").update({
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
	
	root.get("fps", "FpsMeter").update({
		"type":"FpsMeter",
		"xOrigin":"right",
		"yOrigin":"bottom"
	});
	
	root.get("actionFeed", "Group").update({
		"xDisplay":"expand",
		"children":{
			"feed":{
				"type":"Feed",
				"xOrigin":"right",
				"x":-5,
				"y":5,
				"globals":{
					"size":16,
					"borderColour":"#ffffff",
					"borderSize":3,
					"type":"Label",
					"colour":"#000000",
					"extras":{
						"fade":{
							"type":"Fade",
							"delay":60,
							"on":true,
							"then":"die",
							"from":1.0,
							"to":0.0,
							"duration":30
						},
						"die":{
							"type":"Die"
						}
					}
				},
				"append":[
					{"text":"Started!"}
				]
			}
		}
	});
	var feed = root.get("actionFeed").get("feed");
	
	/*dusk.sgui.getPane("test").update({
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
	
	window.aarg =
		{"name":"attack", "colour":"#990000", "los":true, "entFilter":"stat(faction, 1) = ENEMY"};
	window.targ = 
		{"region":"r", "los":true, "forEach":[aarg], "colour":"#000099", "entBlock":"stat(faction, 1) = ENEMY",
			"name":"move"
		};

	var _turns = new TurnTicker();
	
	quest.allyTurnInner = function() {
		return reversiblePromiseChain([
			q.requestBoundPair("selectEntity", 
				{"allowNone":true, "filter":"stat(faction, 1) = ALLY & stat(moved, 3) = false"}
			),
			[function(passedArg, qu) {
				if(!passedArg.entity) {
					qu(q.requestBoundPair("selectListMenu", {"path":"default:menu/menu"}));
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
			}, undefined, "Handle Entity Selection"],
			q.requestBoundPair("generateRegion", targ),
			q.requestBoundPair("getTilePathInRange", {"colour":":default/arrows32.png", "colourChildrenUnder":["attack"],
				"destName":"path", "regionToUse":"move"
			}),
			q.requestBoundPair("moveViaPath"),
			q.requestBoundPair("uncolourRegion", {"regionsToUncolour":["move", "move.attack", "path"]}),
			q.requestBoundPair("generateRegion", aarg),
			q.requestBoundPair("colourRegion", {"regionsToColour":["attack"]}),
			[function(pa) {
				pa.options = [];
				
				pa.mover = pa.entity;
				
				//Attack option
				if(pa.regions["attack"].entities().length) {
					pa.options.push({"text":"Attack!", "listValue":"attack", "listSelectFunction":function(pa, qu) {
						qu(q.requestBoundPair("selectEntity", {"filter":"stat(faction, 1) = ENEMY", "regionToUse":"attack"}));
						qu([function(pa) {
							feed.append({"text":"You killed them!"});
							pa.entity.terminate();
							
							return pa;
						}, undefined, "Kill entity"]);
						
						return pa;
					}});
				}
				
				//Items option
				pa.options.push({"text":"Items", "listValue":"items", "listSelectFunction":function(pa, qu) {
					qu([function(pa) {
						pa.options = [];
						var i = pa.entity.stats.getBlock(2, "weapons");
						i.forEach(function(item, slot) {
							pa.options.push({"text":item.get("displayName"), "listValue":item.type});
						});
						
						return pa;
					}, undefined, "Generate weapons list"]);
					qu(q.requestBoundPair("selectListMenu", {"path":"default:/menu/menu"}));
					
					return pa;
				}});
				
				//Wait option
				pa.options.push({"text":"Wait", "listValue":"wait"});
				
				//Cancel option
				pa.options.push({"text":"Cancel", "listSelectCancel":true});
				
				return pa;
			}, undefined, "After move menu"],
			q.requestBoundPair("selectListMenu", {"path":"default:menu/menu"}),
			q.requestBoundPair("uncolourRegion", {"regionsToUncolour":["attack"]}),
			[function(pa) {
				pa.mover.stats.addBlock(3, "moved", {"moved":true});
				
				return pa;
			}, undefined, "Add moved block"]
		], false)
	//	.then(console.log.bind(console), console.error.bind(console))
		.then(function(pa) {
			if(!pa.endTurn || !q.getLayeredRoom().getPrimaryEntityLayer().filter(
				"stat(faction, 1) = ALLY & stat(moved, 3) = false").length
			) {
				return quest.allyTurnInner();
			}else{
				return pa;
			}
		});
	};
	
	quest.allyTurn = function() {
		feed.append({"text":"Player Phase", "colour":"#000099"});
		return new Promise(function(oFulfill, oReject) {
			quest.allyTurnInner()
			.then(function(pa) {
				var ents = q.getLayeredRoom().getPrimaryEntityLayer().filter("stat(moved, 3)");
				
				for(var i = 0; i < ents.length; i ++) {
					ents[i].stats.removeBlock(3, "moved");
				}
				
				oFulfill(true);
			});
		});
	}
	
	quest.enemyTurn = function() {
		feed.append({"text":"Enemy Phase", "colour":"#990000"});
		return new Promise(function(fulfill) {
			setTimeout(fulfill, 500);
		});
	};
	
	targ.weights = new TileMapWeights(2, 10);
	targ.weights.addWeight(1, 0, 100);
	targ.weights.addWeight(2, 0, 100);
	
	targ.forEach[0].weights = new TileMapWeights(2, 10);
	targ.forEach[0].weights.addWeight(1, 0, 100);
	
	dusk.startGame();
	//quest.go();
	
	window.ss = new SaveSpec("ss", "ss");
	ss.add("dusk.stats", "stats", {});
	
	return quest;
})());
