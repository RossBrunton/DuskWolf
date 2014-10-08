//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("example.items", (function() {
	load.require("dusk.items.sgui.ItemSlot");
	load.require("dusk.sgui.Grid");
	load.require("dusk.items.sgui.ItemHand");
	load.require("dusk.input.sgui.ControlConfig");
	load.require("dusk.sgui.FocusChecker");
	load.require("dusk.items.sgui.ItemGrid");
	load.require("dusk.sgui.Rect");
	var dusk = load.require("dusk");
	var sgui = load.require("dusk.sgui");
	var Group = load.require("dusk.sgui.Group");
	var items = load.require("dusk.items");
	
	//Items test
	sgui.getPane("itemsTest").update({
		"active":true,
		"focus":"itemHand",
		"children":[
			{
				"name":"input",
				"type":"TextBox",
				"width":120,
				"height":30,
				"y":200,
				"upFlow":"itemHand",
				"downFlow":"cc"
			},
			
			{
				"name":"cc",
				"type":"ControlConfig",
				"y":250,
				"upFlow":"input",
				"downFlow":"cc2",
				"control":"sgui_up"
			},
			
			{
				"name":"cc2",
				"type":"ControlConfig",
				"y":270,
				"upFlow":"cc",
				"control":"sgui_action"
			},
			
			{
				"name":"fc",
				"type":"Grid",
				"x":200,
				"rows":10,
				"cols":10,
				"focusBehaviour":Group.FOCUS_ALL,
				"leftFlow":"itemHand",
				"xOffset":10,
				"yOffset":10,
				"populate":{
					"type":"FocusChecker",
					"width":16,
					"height":16
				}
			},
			
			{
				"name":"itemHand",
				"type":"ItemHand",
				"focus":"itemGrid",
				"rightFlow":"fc",
				"downFlow":"input",
				"children":[
					{
						"name":"itemGrid",
						"type":"ItemGrid",
						"populate":[
							{
								"type":"ItemSlot"
							}
						],
						"x":32,
						"leftFlow":"extraSlot"
					},
					
					{
						"name":"extraSlot",
						"type":"ItemSlot",
						"rightFlow":"itemGrid"
					}
				]
			}
		]
	});

	sgui.path("itemsTest:/itemhand/itemGrid/1,1").getInventory().addItem(items.items.create("heal"), 4);
	sgui.path("itemsTest:/itemhand/itemGrid/1,3").getInventory().addItem(items.items.create("blood"), 10);
	sgui.path("itemsTest:/itemhand/itemGrid/2,2").getInventory().addItem(items.items.create("magic"), 23);
	sgui.path("itemsTest:/itemhand/itemGrid/4,3").getInventory().addItem(items.items.create("heal"), 1);
	sgui.path("itemsTest:/itemhand/itemGrid/4,3").getInventory().putItemIntoSlot(items.items.create("heal"), 12);
	sgui.path("itemsTest:/itemhand/itemGrid/3,3").putItem("blood");

	dusk.startGame();
})());
