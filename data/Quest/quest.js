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
	var menu = load.require("dusk.script.actors.menu");
	var Runner = load.require("dusk.script.Runner");
	var Actions = load.require("dusk.script.Actions");
	var uniformModifier = load.require("dusk.tiles.UniformModifier");
	var terrainModifier = load.require("dusk.tiles.TerrainModifier");
	var lrTerrainModifier = load.require("dusk.tiles.lrTerrainModifier");
	
	
	var entityModifier = load.require("dusk.tiles.EntityModifier");
	var entityValidator = load.require("dusk.tiles.EntityValidator");
	var Weights = load.require("dusk.tiles.Weights");
	
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
	root.mouseFocus = false;
	root.allowMouse = true;
	window.qo = dquest.make(root, "quest");
	
	
	//Test
	root.get("menu", "Group").update({
		"allowMouse":true,
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
				"allowMouse":true,
				"globals":{
					"type":"PlusText",
					"plusType":"FocusCheckerRect",
					"behind":true,
					"mouseCursor":"pointer",
					"allowMouse":true,
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
	
	var menuCom = root.path("menu/menu");
	
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
	
	var weights = new Weights(9, 2);
	weights.addSimpleWeight(0, 0, 1, 0);
	weights.addSimpleWeight(1, 0, 100, 0);
	weights.addSimpleWeight(2, 0, 100, 0);
	weights.addSimpleWeight(3, 0, 2, 0);
	
	var lrtm = lrTerrainModifier(weights, qo.layeredRoom);
	var lrem = entityModifier(qo.layeredRoom, [], function(v, e, opt, dir) {
			if(e.meetsTrigger("stat(faction, 1) = ENEMY")) {
				return 100;
			}
			return v;
		}
	);
	var ev = entityValidator(qo.layeredRoom, [], function(){return false;});
	
	window.aarg =
		{"name":"attack", "los":true, "entFilter":"stat(faction, 1) = ENEMY", "weightModifiers":[uniformModifier()]};
	window.targ = 
		{"los":true, "entBlock":"stat(faction, 1) = ENEMY"};
	

	var _turns = new TurnTicker();
	
	/*quest.allyTurnInner = function() {
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
						var i = pa.entity.stats.layer(2).getBlock("weapons");
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
				pa.mover.stats.layer(3).addBlock("moved", {"moved":true});
				
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
					ents[i].stats.layer(3).removeBlock("moved");
				}
				
				oFulfill(true);
			});
		});
	}*/
	
	var turnEnded = false;
	var turnOpen = function(x) {
		if(turnEnded) return false;
		return true;
	}
	
	quest.allyTurn = function(x) {
		turnEnded = false;
		feed.append({"text":"Player Phase", "colour":"#000099"});
		
		return new Runner([
			Actions.while(turnOpen, [
				Actions.print("Test"),
				
				qo.selectActor.pickEntity(function(e) {
					return e.meetsTrigger("stat(faction, 1) = ALLY & stat(moved, 3) = false");
				}, {}, {"allowNone":true}),
				
				Actions.if(function(x) {return x.entity}, [
					Actions.copy("entity", "selected"),
					
					function(passedArg) {
						var ranges = passedArg.entity.stats.get("possibleRange", 2);
						var rmap = [];
						
						for(var i = 0; i < ranges.length; i ++) {
							for(var a = ranges[i][0]; a <= ranges[i][1]; a ++) {
								rmap[a] = true;
							}
						}
						
						//aarg.rangeMap = rmap;
						aarg.ranges = ranges;
						passedArg.aarg = aarg;
						passedArg.children = {"attack":aarg};
						passedArg.ranges = [0, passedArg.entity.stats.get("move", 1)];
						
						return passedArg;
					},
					
					qo.regionsActor.generate({"z":0, "weightModifiers":[lrem, lrtm], "validators":[ev]}, {"copy":[
						["ranges", "ranges"], ["children", "children"], ["x", "x"], ["y", "y"]
					]}),
					
					qo.regionsActor.display("atk", "#ffffff", {"sub":"attack"}),
					qo.regionsActor.display("mov", "#000000", {}),
					qo.regionsActor.makePath("", {}),
					qo.regionsActor.displayPath("movePath", "default/arrows32.png", {}),
					qo.selectActor.pickTile({}, {}),
					qo.regionsActor.unDisplay(["atk", "mov", "movePath"], {}),
					qo.selectActor.followPath({}),
					qo.regionsActor.getSubRegion("attack", {}),
					qo.regionsActor.display("myattack", "#990000", {}),
					qo.selectActor.entitiesInRegion({}),
					
					Actions.print("Value is %"),
					
					function(x) {
						x.menuChoices = [];
						
						if(x.entities.length) {
							x.menuChoices.push([{"text":"Attack!"}, [
								qo.selectActor.pickEntityInRegion(function(e) {
									return e.meetsTrigger("stat(faction, 1) = ENEMY");
								}, {}, {}),
								
								function(x) {
									feed.append({"text":"You killed them!"});
									x.entity.terminate();
									
									return x;
								}
							]]);
						}
						
						x.menuChoices.push([{"text":"Items"}, [
							function(x) {
								x.menuChoices = [];
								
								var i = x.entity.stats.layer(2).getBlock("weapons");
								i.forEach(function(item, slot) {
									x.menuChoices.push([{"text":item.get("displayName")}, []]);
								});
								
								x.menuChoices.push([{"text":"Cancel"}, false]);
								
								return x;
							},
							
							menu.gridMenu([], menuCom, {"copyChoices":true}),
						]]);
						
						x.menuChoices.push([{"text":"Wait"}, []]);
						
						x.menuChoices.push([{"text":"Cancel"}, false]);
						
						return x;
					},
					
					menu.gridMenu([], menuCom, {"copyChoices":true}),
					
					qo.regionsActor.unDisplay(["myattack"], {}),
					
					function(pa) {
						pa.selected.stats.layer(3).addBlock("moved", {"moved":true});
						
						return pa;
					},
				], [
					Actions.print("Here"),
					menu.gridMenu([
						[{"text":"Done"}, [
							function(x) {turnEnded = true; return x}
						]], [{"text":"Cancel"}, false]
					], menuCom, {}),
				]),
				
				//Actions.print("End of while"),
			]),
			
			function(x) {
				var ents = qo.layeredRoom.getPrimaryEntityLayer().filter("stat(moved, 3)");
				
				for(var e of ents) {
					e.stats.layer(3).removeBlock("moved");
				}
				
				return x;
			}
		]).start({});
	};
	
	quest.enemyTurn = function() {
		feed.append({"text":"Enemy Phase", "colour":"#990000"});
		return new Promise(function(fulfill) {
			setTimeout(fulfill, 500);
		});
	};
	
	//targ.weights = new TileMapWeights(2, 10);
	//targ.weights.addWeight(1, 0, 100);
	//targ.weights.addWeight(2, 0, 100);
	
	//targ.forEach[0].weights = new TileMapWeights(2, 10);
	//targ.forEach[0].weights.addWeight(1, 0, 100);
	
	dusk.startGame();
	//quest.go();
	
	window.ss = new SaveSpec("ss", "ss");
	ss.add("dusk.stats", "stats", {});
	
	return quest;
})());
