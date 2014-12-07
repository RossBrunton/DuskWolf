"use strict";

load.provide("questScript", (function() {
	load.require("dusk.sgui.FancyRect");
	load.require("dusk.sgui.Grid");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.FocusChecker");
	load.require("dusk.sgui.extras.MatchedSize");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.Feed");
	load.require("dusk.sgui.SayBox");
	
	load.require("dusk.sgui.extras.Die");
	load.require("dusk.sgui.extras.Fade");
	
	var dusk = load.require("dusk");
	var items = load.require("dusk.items");
	var save = load.require("dusk.save");
	var ConsoleSource = load.require("dusk.save.sources.ConsoleSource");
	var TurnTicker = load.require("dusk.TurnTicker");
	var c = load.require("dusk.sgui.c");
	var dquest = load.require("dusk.rooms.quest");
	var sgui = load.require("dusk.sgui");
	var TileMapWeights = load.require("dusk.tiles.sgui.TileMapWeights");
	var reversiblePromiseChain = load.require("dusk.utils.reversiblePromiseChain");
	var Scriptable = load.require("dusk.entities.behave.Scriptable");

	var ents = load.require("quest.ents");
	load.require("quest.rooms.rooma");
	
	var quest = {};

	//Test
	var root = sgui.get("default", true);
	dquest.make(root, "quest");
	
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

	root.get("menu", "Group").update({
		"children":{
			"meter":{
				"type":"FpsMeter",
				"xOrigin":"right",
				"yOrigin":"bottom"
			},
		}
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
	var feed = sgui.get("actionFeed", "Group").getComponent("feed");

	window.q = dquest.puppeteer;
	
	// Apply styles
	sgui.addStyle("SayBox>TextBack", {
		"plusType":"FancyRect",
		"plus":{
			"back":"fancyRect/back.png",
			"top":"fancyRect/top.png",
			"bottom":"fancyRect/bottom.png",
			"left":"fancyRect/left.png",
			"right":"fancyRect/right.png",
			"topLeft":"fancyRect/topLeft.png",
			"topRight":"fancyRect/topRight.png",
			"bottomLeft":"fancyRect/bottomLeft.png",
			"bottomRight":"fancyRect/bottomRight.png",
		},
		"label":{
			"borderColour":"#ffffff",
			"borderSize":0,
			"colour":"#ffffff",
			"size":16,
			"font":"sans"
		}
	});
	
	// Draw GUI
	root.get("saybox", "Group").update({
		"focus":"say",
		"xDisplay":"expand",
		"yDisplay":"expand",
		"children":{
			"say":{
				"type":"SayBox",
				"yOrigin":"bottom",
				"xOrigin":"middle",
				"xDisplay":"expand",
				"y":-10,
				"children":{
					"right":{
					},
					"left":{
					},
					"body":{
					}
				}
			},
		},
	});
	
	var sayBox = sgui.path("default:/saybox/say");
	
	dusk.onLoad.listen(function (e){
		dquest.rooms.setRoom("quest.rooms.rooma", 0).then(
		reversiblePromiseChain([
			sayBox.sayBoundPair("", "Once upon a time..."),
			Scriptable.requestBoundPair("#1", "gridWalk", {"moves":[c.DIR_RIGHT, c.DIR_RIGHT]}),
			sayBox.sayBoundPair("Left Guy", "Hey, can I ask you something?"),
			sayBox.sayBoundPair("Right Guy", "What is it this time?"),
			sayBox.sayBoundPair("Left Guy", "Have you ever thought we could be in, like, a game or something?"),
			Scriptable.requestBoundPair("#2", "gridWalk", {"moves":[c.DIR_RIGHT, c.DIR_LEFT]}),
			Scriptable.requestBoundPair("#2", "animate", {"animation":"panic"}),
			sayBox.sayBoundPair("Right Guy", "You idiot! You can't say stuff like that!"),
		], false, {})
		.then(console.log.bind(console), console.error.bind(console)));
	});
	
	dusk.startGame();
	
	return quest;
})());
