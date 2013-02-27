//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.ItemSlot");
dusk.load.require("dusk.sgui.Grid");
dusk.load.require("dusk.sgui.ItemHand");
dusk.load.require("dusk.sgui.ControlConfig");
dusk.load.require("dusk.sgui.FocusChecker");
dusk.load.require("dusk.sgui.ItemGrid");
dusk.load.require("dusk.sgui.Rect");
dusk.load.require("dusk");

dusk.load.provide("example.items");

//Items test
dusk.sgui.getPane("itemsTest").parseProps({
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
			"focusBehaviour":dusk.sgui.Group.FOCUS_ALL,
			"leftFlow":"itemHand",
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

dusk.sgui.path("itemsTest:/itemhand/itemGrid/1,1").getInventory().addItem(dusk.items.items.create("heal"), 4);
dusk.sgui.path("itemsTest:/itemhand/itemGrid/1,3").getInventory().addItem(dusk.items.items.create("blood"), 10);
dusk.sgui.path("itemsTest:/itemhand/itemGrid/2,2").getInventory().addItem(dusk.items.items.create("magic"), 23);
dusk.sgui.path("itemsTest:/itemhand/itemGrid/4,3").getInventory().addItem(dusk.items.items.create("heal"), 1);
dusk.sgui.path("itemsTest:/itemhand/itemGrid/4,3").getInventory().putItemIntoSlot(dusk.items.items.create("heal"), 12);
dusk.sgui.path("itemsTest:/itemhand/itemGrid/3,3").putItem("blood");

dusk.startGame();
