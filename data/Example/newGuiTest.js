//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.newGui", (function() {
	load.require("dusk.sgui.Pane");
	load.require("dusk.sgui.Rect");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.Grid");
	load.require("dusk.sgui.Selection");
	load.require("dusk.sgui.Checkbox");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.extras.SineSlide");
	load.require("dusk.sgui.extras.Radiobox");
	load.require("dusk.sgui.DynamicGrid");
	load.require("dusk.sgui.extras.DynamicWidth");
	load.require("dusk.sgui.RangeText");
	load.require("dusk.sgui.Scroller");
	load.require("dusk.sgui.NumberBox");
	var Range = load.require("dusk.Range");
	var dusk = load.require("dusk");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require("dusk.sgui");
	
	var _testRange = new Range(0, 10, 5);

	//Basic offsets and such
	sgui.getPane("newGui").parseProps({
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
							"dwidth":{"type":"DynamicWidth", "min":0, "max":98, "range":_testRange}
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
	sgui.getPane("grid").parseProps({
		"active":true,
		"focus":"check",
		"extras":{
			"fadey":{"type":"SineSlide", "duration":60, "delay":0, "on":true,
				"peak":75, "modifier":1.5, "dir":c.DIR_RIGHT
			},
			//"fada":{"type":"Fade", "duration":1000, "from":0, "to":1,}
		},
		"children":{
			"tr":{
				"type":"Grid",
				"populate":{
					"type":"RangeText",
					"range":_testRange,
				},
				"rows":10,
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
				"xOrigin":c.ORIGIN_MAX,
				"yOrigin":c.ORIGIN_MAX,
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
				"xOrigin":c.ORIGIN_MIDDLE,
				"yOrigin":c.ORIGIN_MIDDLE
			},
			"c":{
				"type":"Rect",
				"width":3,
				"height":3,
				"x":sgui.width/2 - 1,
				"y":sgui.height/2 - 1
			},
			"dg":{
				"type":"DynamicGrid",
				"range":_testRange,
				"orientation":c.ORIENT_VER,
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

	//Text
	sgui.getPane("textTest").parseProps({
		"focus":"in",
		"children":{
			"textTest":{
				"type":"Label",
				"font":"serif",
				"multiline":true,
				"width":700,
				"height":400,
				"text":"[font sans]Hello[/font] [colour #ff0000][[]World!][/colour] [img smile.png] [b]B[/b] [i]I[/i] [b][i]BI[/b][/i] [i][b]IB[/b][/i] [bcolour #ff0000][bsize 3]Lorem ipsum dolor sit amet[/bsize][/bcolour], consectetur adipiscing elit. Morbi adipiscing molestie tristique. Sed pretium justo sed neque dignissim facilisis. Phasellus consequat sagittis erat. Aliquam sagittis odio quis enim tempus laoreet. Aliquam erat volutpat. Cras sit amet lorem quis massa laoreet tincidunt euismod sed neque. Cras hendrerit, nunc ac eleifend porta, ipsum augue imperdiet est, in lobortis nulla lacus sed augue. Aliquam ornare cursus massa, quis dapibus turpis interdum non. Suspendisse accumsan metus in dui facilisis ultricies. Integer sit amet velit et neque pulvinar vehicula. Suspendisse laoreet pretium metus et vestibulum. Nunc quis dui sit amet odio pharetra aliquet. Praesent varius interdum iaculis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.Suspendisse neque odio, interdum ac pharetra sed, aliquam eget nisl. Ut tincidunt diam diam, at tincidunt odio. Vivamus non dui purus. Vestibulum eu ligula ut enim iaculis feugiat. Pellentesque congue, est elementum fermentum hendrerit, velit neque gravida diam, nec posuere lectus sem id ante. Morbi consectetur orci nec quam gravida nec vehicula justo fermentum. Integer velit velit, tincidunt sed elementum sit amet, eleifend et tellus. Duis malesuada elit a neque mollis vel iaculis diam interdum. Sed dapibus semper ante non volutpat. Mauris porttitor leo sit amet lacus faucibus et euismod leo ultrices. Fusce ut lacus commodo arcu ultrices gravida eget ac felis. Donec tincidunt auctor mattis. Donec rhoncus aliquet tempor. Nullam lectus magna, lobortis quis ullamcorper nec, rhoncus in lorem. Duis non nibh vitae urna imperdiet tincidunt. Aliquam aliquam, enim eget fermentum dapibus, nisl purus porta enim, consequat ultricies libero nisl quis justo. Maecenas non risus et mauris varius pharetra at nec nibh. Vivamus et est tortor, sed vestibulum quam. In hac habitasse platea dictumst. Integer congue ultrices massa, quis pretium elit auctor sit amet. Vivamus sed rhoncus dolor. Vivamus fringilla hendrerit lectus quis eleifend. Proin aliquam porttitor commodo. Morbi faucibus nunc vel magna porta aliquam. Suspendisse ultricies, sem ut porta vehicula, enim metus tempor dui, et accumsan augue erat quis nisl. Fusce nec dui ut tellus ultrices gravida ac at lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Aliquam sollicitudin magna ac nisi interdum non viverra quam tincidunt. Ut gravida nulla sit amet enim interdum eget adipiscing libero hendrerit. Aliquam ullamcorper, enim vitae commodo varius, sapien est mollis nunc, ut commodo turpis lacus ac elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut a risus vitae mauris placerat convallis eu sit amet nunc. Etiam non venenatis diam. Vestibulum neque purus, sodales ut fringilla eu, luctus et ipsum. Proin et nibh nec dui tempus cursus non ac ligula. Suspendisse molestie risus eu nibh cursus non sagittis erat dignissim. Maecenas eget metus quam, in condimentum ante. Suspendisse potenti. Nam risus dolor, tincidunt ut placerat ut, aliquam in massa. Fusce sagittis nulla et dolor volutpat vulputate consectetur mi viverra. Nam dignissim massa sem, vitae condimentum lacus. ",
			},
			"in":{
				"type":"TextBox",
				"y":20
			}
		}
	});

	//Scrolling
	sgui.getPane("scrollTest").parseProps({
		"active":true,
		"focus":"scroll",
		"children":{
			"rects":{
				"horScroll":_testRange,
				"type":"Group",
				"width":50,
				"height":50,
				"children":{
					"recta":{
						"type":"Rect",
						"width":50,
						"height":50,
						"colour":"#ff0000"
					},
					"rectb":{
						"type":"Rect",
						"width":50,
						"height":50,
						"x":50,
						"colour":"#ffff00"
					},
					"rectc":{
						"type":"Rect",
						"width":50,
						"height":50,
						"y":50,
						"colour":"#00ff00"
					},
					"rectd":{
						"type":"Rect",
						"width":50,
						"height":50,
						"x":50,
						"y":50,
						"colour":"#0000ff"
					},
				}
			},
			"scroll":{
				"target":"../rects",
				"type":"Scroller",
				"orientation":c.ORIENT_HOR,
				"upFlow":"scrollV"
			},
			"scrollV":{
				"target":"../rects",
				"type":"Scroller",
				"orientation":c.ORIENT_VER,
				"leftFlow":"scroll"
			},
		}
	});

	sgui.getPane("inputs").parseProps({
		"active":true,
		"focus":"inp",
		"children":{
			"inp":{
				"type":"Grid",
				"populate":{
					"type":"NumberBox",
					"range":_testRange,
					"height":20,
					"width":50,
					"validFilter":/^\d+$/
				},
				"rows":1,
				"cols":10,
				"x":100,
				"y":100
			}
		}
	});
	
	window.range = _testRange;

	dusk.startGame();
})());
