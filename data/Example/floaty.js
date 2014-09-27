//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.floaty", (function() {
	load.require("dusk.particles.sgui.ParticleField");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.extras.SineSlide");
	load.require("dusk.sgui.extras.Fade");
	load.require("dusk.particles.particleEffects.core");
	
	var dusk = load.require("dusk");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	sgui.getPane("floaty").parseProps({
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
						"dir":c.DIR_UP,
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
})());
