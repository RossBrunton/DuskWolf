//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.ParticleField");
dusk.load.require("dusk.sgui.Pane");
dusk.load.require("dusk.frameTicker");
dusk.load.require("dusk.sgui.effects.spread");
dusk.load.require("dusk.sgui.effects.spew");

dusk.load.provide("example.particles");

dusk.sgui.getPane("particles").parseProps({
	//"yOffset":50,
	"children":{
		"parts":{
			"type":"ParticleField",
			"width":dusk.sgui.width,
			"height":dusk.sgui.height,
		}
	},
	"active":true
});

dusk.frameTicker.onFrame.listen(function(e) {
	var p = dusk.sgui.path("particles:/parts");
	
	p.applyEffect("spew", {"count":10, "r":[180, 255], "g":0, "b":0, "x":dusk.sgui.width*0.5, "y":dusk.sgui.height-100,
		"dy":[-1, -4], "dx":[-2, 2], "lifespan":60, "ddy":[0, 0.1], "dylimit":1
	});
	
	p.applyEffect("spew", {"count":10, "r":0, "g":[180, 255], "b":0, "x":dusk.sgui.width*0.25, "y":dusk.sgui.height-100,
		"dy":[-1, -4], "dx":[-2, 2], "lifespan":60, "ddy":[0, 0.1], "dylimit":1
	});
	
	p.applyEffect("spew", {"count":10, "r":0, "g":0, "b":[180, 255], "x":dusk.sgui.width*0.75, "y":dusk.sgui.height-100,
		"dy":[-1, -4], "dx":[-2, 2], "lifespan":60, "ddy":[0, 0.1], "dylimit":1
	});
}, this);

dusk.startGame();
