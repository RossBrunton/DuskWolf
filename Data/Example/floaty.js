//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.ParticleField");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.sgui.extras.SineSlide");
dusk.load.require("dusk.sgui.extras.Fade");
dusk.load.require("dusk.sgui.effects.core");
dusk.load.require("dusk");

dusk.load.provide("example.floaty");

dusk.sgui.getPane("floaty").parseProps({
	"children":{
		"text":{
			"type":"Label",
			"x":200,
			"y":200,
			"text":"9999",
			"colour":"#990000",
			"borderColour":"#000000",
			"borderSize":1,
			"extras":{
				"floating":{
					"type":"SineSlide",
					"dir":dusk.sgui.c.DIR_UP,
					"peak":100,
					"on":true,
					"delay":0,
					"duration":20,
					"then":[function(elem) {
						elem.path("../pf").applyEffect("image", 
							{"source":"C"+elem.fullPath(), "effect":"spread", "count":5, "x":elem.x+(elem.width/2), "y":elem.y+(elem.height/2),
								"lifespan":10, "dx":0, "ddy":0
							});
						
						elem.deleted = true;
					}],
				}
			}
		},
		"pf":{
			"type":"ParticleField",
			"width":500,
			"height":500
		},
	}
});

dusk.startGame();
