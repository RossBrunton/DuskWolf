//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui");
dusk.load.require("dusk.sgui.BasicMain");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.entities");
dusk.load.require("dusk.RoomManager");
dusk.load.require("dusk.sgui.extras.QuestPuppeteer");

dusk.load.provide("dusk.quest");

/* @namespace dusk.quest
 * @name dusk.quest
 * 
 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
 * 
 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
dusk.quest._init = function() {
	//Default skills
	
	var main = dusk.sgui.getPane("quest");
	main.modifyComponent([{"name":"main", "type":"BasicMain", "width":-2, "height":-2}]);
	main.becomeActive();
	main.flow("main");
	
	main.getComponent("main").layers = [
		{"name":"back", "type":dusk.sgui.BasicMain.LAYER_TILEMAP},
		{"name":"scheme", "type":dusk.sgui.BasicMain.LAYER_SCHEME},
		{"name":"regions", "type":dusk.sgui.BasicMain.LAYER_REGION},
		{"name":"entities", "type":dusk.sgui.BasicMain.LAYER_ENTITIES, "primary":true},
		{"name":"parts", "type":dusk.sgui.BasicMain.LAYER_PARTICLES},
		{"name":"over", "type":dusk.sgui.BasicMain.LAYER_TILEMAP},
		{"name":"transitions", "type":dusk.sgui.BasicMain.LAYER_TRANSITIONS}
	];
	
	dusk.entities.types.createNewType("quest", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"img":"pimg/hero.png", "solid":true, "collides":true
		},
		"animation":["true", "0,0", {}],
		"behaviours":{}
	});
	
	main.getComponent("main").addExtra("QuestPuppeteer", "questPuppeteer", {});
	dusk.quest.puppeteer = main.getComponent("main").getExtra("questPuppeteer");
	
	dusk.quest.rooms = new dusk.RoomManager("dusk.quest", "dusk.quest.rooms");
	dusk.quest.rooms.setBasicMain(main.getComponent("main"));
};

dusk.quest._init();
