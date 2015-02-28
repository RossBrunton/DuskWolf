//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("guiTest", (function() {
	load.require("dusk.sgui.DynamicGrid");
	load.require("dusk.input.sgui.ControlConfig");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.Image");
	load.require("dusk.particles.particleEffects.core.spread");
	load.require("dusk.sgui.FpsMeter");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.entities.sgui.EntityWorkshop");
	load.require("dusk.sgui.TextBack");
	
	var SaveSpec = load.require("dusk.save.SaveSpec");
	var checkpoints = load.require("dusk.checkpoints");
	
	var dplat = load.require("dusk.rooms.plat");
	var entities = load.require("dusk.entities");
	var dusk = load.require("dusk");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var controls = load.require("dusk.input.controls");
	var frameTicker = load.require("dusk.utils.frameTicker");
	var Range = load.require("dusk.utils.Range");
	
	var root = sgui.get("default", true);
	
	window.root = root;
	
	root.mark = "#ff00ff";
	
	var cross = {
		"l":{
			"type":"Image",
			"x":10,
			"y":30,
			"src":"default/test.png",
			"width":20,
			"height":20
		},
		
		"t":{
			"type":"Image",
			"x":30,
			"y":10,
			"src":"default/test.png",
			"width":20,
			"height":20,
		},
		
		"c":{
			"type":"Image",
			"x":30,
			"y":30,
			"src":"default/test.png",
			"width":20,
			"height":20,
		},
		
		"b":{
			"type":"Image",
			"x":30,
			"y":50,
			"src":"default/test.png",
			"width":20,
			"height":20,
		},
		
		"r":{
			"type":"Image",
			"x":50,
			"y":30,
			"src":"default/test.png",
			"width":20,
			"height":20,
		},
	};
	
	//root.noCleanCanvas = true;
	
	root.get("body", "Group").update({
		"xDisplay":"expand",
		"yDisplay":"expand",
		"margins":[50, 50, 50, 50],
		"focus":"tbox",
		"children":{
			// Text
			"txt1":{
				"type":"Label",
				"text":"Hello World!",
				"xOrigin":"right",
				"y":50,
				"x":-10,
			},
			
			"txt2":{
				"type":"Label",
				"text":"Hello World!",
				"xOrigin":"right",
				"y":80,
				"x":-10,
				"size":20
			},
			
			"txt3":{
				"type":"Label",
				"text":"Hello World!",
				"xOrigin":"right",
				"y":110,
				"x":-10,
				"size":20,
				"width":50,
			},
			
			"txt4cnt":{
				"type":"Group",
				"xOffset":5,
				"yOffset":5,
				"width":100,
				"height":10,
				"y":150,
				"x":-10,
				"xOrigin":"right",
				"children":{
					"txt4":{
						"type":"Label",
						"text":"Hello World!",
						"size":20
					},
				},
			},
			
			"txt5cnt":{
				"type":"Group",
				"xOffset":5,
				"yOffset":5,
				"y":200,
				"x":-10,
				"xOrigin":"right",
				"children":{
					"txt5":{
						"type":"Label",
						"text":"Hello World!",
						"size":20,
						"xOrigin":"right",
					},
				},
			},
			
			"none":{
				"type":"Group",
				"children":cross,
				"x":20,
				"y":20,
			},
			
			// Offsets
			"x":{
				"type":"Group",
				"children":cross,
				"xOffset":20,
				"x":20,
				"y":100,
			},
			
			"y":{
				"type":"Group",
				"children":cross,
				"yOffset":20,
				"x":100,
				"y":100,
			},
			
			"xy":{
				"type":"Group",
				"children":cross,
				"yOffset":20,
				"xOffset":20,
				"x":200,
				"y":100,
			},
			
			//Dimensions
			"w":{
				"type":"Group",
				"children":cross,
				"width":60,
				"x":20,
				"y":200,
			},
			
			"h":{
				"type":"Group",
				"children":cross,
				"height":60,
				"x":100,
				"y":200,
			},
			
			"wh":{
				"type":"Group",
				"children":cross,
				"width":60,
				"height":60,
				"x":200,
				"y":200,
			},
			
			// Both!
			"xywh":{
				"type":"Group",
				"children":cross,
				"width":40,
				"height":40,
				"xOffset":20,
				"yOffset":20,
				"x":20,
				"y":300,
			},
			
			// Image
			"ei":{
				"type":"Group",
				"xOrigin":"middle",
				"yOrigin":"middle",
				"width":50,
				"height":50,
				"children":{
					"img":{
						"margins":[5, 5, 5, 5],
						"type":"Image",
						"xDisplay":"expand",
						"yDisplay":"expand",
						"src":"default/test.png"
					}
				}
			},
			
			"eic":{
				"type":"Group",
				"xOrigin":"middle",
				"yOrigin":"middle",
				"y":100,
				"xOffset":10,
				"yOffset":10,
				"width":50,
				"height":50,
				"children":{
					"img":{
						"margins":[5, 5, 5, 5],
						"type":"Image",
						"xDisplay":"expand",
						"yDisplay":"expand",
						"src":"default/test.png"
					}
				}
			},
			
			// Grid
			"grid":{
				"type":"Grid",
				"rows":5,
				"cols":7,
				"hspacing":2,
				"vspacing":2,
				"xOrigin":"right",
				"yOrigin":"bottom",
				"populate":{
					"type":"Image",
					"width":20,
					"height":20,
					"src":"default/test.png"
				},
				"width":200,
				"height":200,
			},
			
			// Expand grid
			"egridC":{
				"type":"Group",
				"xOffset":50,
				"yOffset":50,
				"xDisplay":"expand",
				"yDisplay":"expand",
				"visible":false,
				//"margins":[20, 20, 20, 20],
				"children":{
					"egrid":{
						"mark":"#00ff00",
						"type":"Grid",
						"rows":11,
						"cols":11,
						"xDisplay":"expand",
						"yDisplay":"expand",
						"alpha":0.5,
						"vspacing":5,
						"hspacing":10,
						//"margins":[5, 5, 5, 5],
						"globals":{
							"type":"Rect",
							"xDisplay":"expand",
							"yDisplay":"expand",
						},
						//"visible":false,
						"populate":[{"colour":"#ff9999"}, {"colour":"#9999ff"}]
					}
				},
			},
			
			// BackText
			"btext":{
				"type":"TextBack",
				//"visible":false,
				"x":100,
				"y":20,
				"width":100,
				"height":40,
				"plus":{
					"type":"Rect",
					"colour":"#333333",
					"mark":"#ff9900",
				},
				"text":"Hai!",
			},
			
			// Textbox
			"tbox":{
				"type":"TextBox",
				"x":200,
				"y":20,
				"width":100,
				"height":40
			},
			"tbox2":{
				"type":"TextBox",
				"x":300,
				"y":20,
				"width":100,
				"height":40
			},
		}
	});
	
	root.get("rate", "FpsMeter").update({
		"type":"FpsMeter",
		"yOrigin":"bottom",
		"xOrigin":"right",
	});
	
	root.flow("body");
	
	dusk.startGame();
})());
