//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Pane");
dusk.load.require("dusk.sgui.Rect");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk");

dusk.load.provide("example.newGui");

//Items test
dusk.sgui.getPane("newGui").parseProps({
	"active":true,
	"xOffset":50,
	"yOffset":45,
	"x":50,
	"y":50,
	"width":500,
	"children":{
		"rect":{
			"type":"Rect",
			"width":100,
			"height":100,
			"x":125,
			"colour":"#00ff00"
		},
		"tex":{
			"type":"Label",
			"height":15,
			"x":125,
			"y":50,
			"text":"HELLO!"
		},
		"rectorz":{
			"type":"Rect",
			"width":50,
			"height":50,
			"x":25,
			"y":25,
			"colour":"#0000ff"
		},
		"gr":{
			"type":"Group",
			"y":50,
			"x":0,
			"xOffset":50,
			"width":75,
			"children":{
				"r1":{
					"type":"Rect",
					"width":20,
					"height":20,
					"x":50,
					"y":50,
					"colour":"#ffff00"
				},
				"r2":{
					"type":"Rect",
					"width":20,
					"height":20,
					"x":75,
					"y":75,
					"colour":"#ffff00"
				},
				"r3":{
					"type":"Rect",
					"width":20,
					"height":20,
					"x":100,
					"y":100,
					"colour":"#ffff00"
				}
			}
		}
	}
});

dusk.startGame();
