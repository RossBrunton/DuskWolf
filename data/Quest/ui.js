"use strict";

load.provide("quest.ui", (function() {
	load.require("dusk.sgui.FancyRect");
	load.require("dusk.sgui.Grid");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.FocusChecker");
	load.require("dusk.sgui.extras.MatchedSize");
	load.require("dusk.sgui.FpsMeter");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var RegionDisplay = load.require("dusk.tiles.sgui.RegionDisplay");
	load.require("dusk.sgui.Feed");
	
	load.require("dusk.sgui.extras.Die");
	load.require("dusk.sgui.extras.Fade");
	
	var dusk = load.require("dusk");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require("dusk.sgui");
	
	var root = sgui.get("default", true);
	root.mouseFocus = false;
	root.allowMouse = true;
	
	//Menu
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
	
	
	// FPS Meter
	root.get("fps", "FpsMeter").update({
		"type":"FpsMeter",
		"xOrigin":"right",
		"yOrigin":"bottom"
	});
	
	
	// Feed on right of screen
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
	
	return root;
})());
