//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";



load.provide("example.particles", (function() {
	var sgui = load.require("dusk.sgui");
	var dusk = load.require("dusk");
	load.require("dusk.sgui.ParticleField");
	load.require("dusk.sgui.Pane");
	var frameTicker = load.require("dusk.frameTicker");
	load.require("dusk.sgui.effects.spread");
	load.require("dusk.sgui.effects.spew");
	
	sgui.getPane("particles").parseProps({
		//"yOffset":50,
		"children":{
			"parts":{
				"type":"ParticleField",
				"width":sgui.width,
				"height":sgui.height,
			}
		},
		"active":true
	});

	frameTicker.onFrame.listen(function(e) {
		var p = sgui.path("particles:/parts");
		
		p.applyEffect("spew", {"count":10, "r":[180, 255], "g":0, "b":0, "x":sgui.width*0.5, "y":sgui.height-100,
			"dy":[-1, -4], "dx":[-2, 2], "lifespan":60, "ddy":[0, 0.1], "dylimit":1
		});
		
		p.applyEffect("spew", {"count":10, "r":0, "g":[180, 255], "b":0, "x":sgui.width*0.25, "y":sgui.height-100,
			"dy":[-1, -4], "dx":[-2, 2], "lifespan":60, "ddy":[0, 0.1], "dylimit":1
		});
		
		p.applyEffect("spew", {"count":10, "r":0, "g":0, "b":[180, 255], "x":sgui.width*0.75, "y":sgui.height-100,
			"dy":[-1, -4], "dx":[-2, 2], "lifespan":60, "ddy":[0, 0.1], "dylimit":1
		});
	}, this);

	dusk.startGame();
})());
