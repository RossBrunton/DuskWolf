//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Pane");
dusk.load.require("dusk.sgui.Rect");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.sgui.Grid");
dusk.load.require("dusk.sgui.Selection");
dusk.load.require("dusk.sgui.Checkbox");
dusk.load.require("dusk.sgui.extras.SineSlide");
dusk.load.require("dusk.sgui.extras.Radiobox");
dusk.load.require("dusk.sgui.DynamicGrid");
dusk.load.require("dusk.sgui.extras.DynamicWidth");
dusk.load.require("dusk.sgui.RangeText");
dusk.load.require("dusk.Range");
dusk.load.require("dusk");

dusk.load.provide("example.newGui");

example.newGui.testRange = new dusk.Range(0, 10, 5);

//Basic offsets and such
dusk.sgui.getPane("newGui").parseProps({
	"xOffset":50,
	"yOffset":45,
	"x":50,
	"y":50,
	"width":500,
	"children":{
		"bar":{
			"type":"Group",
			"x":200,
			"y":200,
			"children":{
				"case":{
					"type":"Rect",
					"width":100,
					"height":30,
					"colour":"#003300",
					"bwidth":0,
				},
				"body":{
					"type":"Rect",
					"height":28,
					"x":1,
					"y":1,
					"extras":{
						"dwidth":{"type":"DynamicWidth", "min":0, "max":98, "range":example.newGui.testRange}
					},
					"colour":"#00ff00"
				}
			}
		},
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

//Grids
dusk.sgui.getPane("grid").parseProps({
	"active":true,
	"focus":"tr",
	"extras":{
		"fadey":{"type":"SineSlide", "duration":60, "delay":0, "on":true,
			"peak":75, "modifier":1.5, "dir":dusk.sgui.Component.DIR_RIGHT
		},
		//"fada":{"type":"Fade", "duration":1000, "from":0, "to":1,}
	},
	"children":{
		"tr":{
			"type":"RangeText",
			"range":example.newGui.testRange,
			"x":50,
			"y":50
		},
		"check":{
			"type":"Grid",
			"extras":{
				"radio":{"type":"Radiobox"}
			},
			"rows":5,
			"cols":5,
			//"alpha":0.5,
			"vspacing":5,
			"hspacing":5,
			"populate":{
				"type":"Checkbox"
			},
			"x":400,
			"y":150
		},
		"grd":{
			"type":"Selection",
			"xOrigin":dusk.sgui.Component.ORIGIN_MAX,
			"yOrigin":dusk.sgui.Component.ORIGIN_MAX,
			"x":-50,
			"y":-50,
			"options":10,
			"globals":{"type":"Label", "height":20, "padding":5, "colour":"#0000ff"},
			"populate":[
				{"text":"1"}, {"text":"2"}, {"text":"3"}, {"text":"4"}, {"text":"5"}
			],
			"activeBorder":"#ff0000"
		}/*,
		"test":{
			"type":"Label",
			"xOrigin":dusk.sgui.Component.ORIGIN_MAX,
			"x":-20,
			"text":"Test Text",
		}*/,
		"r":{
			"type":"Rect",
			"width":50,
			"height":50,
			"xOrigin":dusk.sgui.Component.ORIGIN_MIDDLE,
			"yOrigin":dusk.sgui.Component.ORIGIN_MIDDLE
		},
		"c":{
			"type":"Rect",
			"width":3,
			"height":3,
			"x":dusk.sgui.width/2 - 1,
			"y":dusk.sgui.height/2 - 1
		},
		"dg":{
			"type":"DynamicGrid",
			"range":example.newGui.testRange,
			"orientation":dusk.sgui.DynamicGrid.ORIENT_VER,
			"populate":{
				"type":"Rect",
				"width":20,
				"height":40,
				"colour":"#00ff00",
				"bColour":"009900"
			}
		}
	}
});

dusk.startGame();
