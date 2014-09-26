//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.quest", (function() {
	var sgui = load.require("dusk.sgui");
	var BasicMain = load.require("dusk.rooms.sgui.BasicMain");
	var entities = load.require("dusk.entities");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var QuestPuppeteer = load.require("dusk.sgui.extras.QuestPuppeteer");
	
	/* @namespace dusk.rooms.quest
	 * @name dusk.rooms.quest
	 * 
	 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
	 * 
	 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
	 */
	var quest = {};
	
	//Default skills
	
	var main = sgui.getPane("quest");
	main.modifyComponent([{"name":"main", "type":"BasicMain", "width":-2, "height":-2}]);
	main.becomeActive();
	main.flow("main");
	
	entities.types.createNewType("quest", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"src":"pimg/hero.png", "solid":true, "collides":true
		},
		"animation":["true", "0,0", {}],
		"behaviours":{}
	});
	
	main.getComponent("main").addExtra("QuestPuppeteer", "questPuppeteer", {});
	quest.puppeteer = main.getComponent("main").getExtra("questPuppeteer");
	
	quest.rooms = new RoomManager("dusk.rooms.quest", "rooms");
	quest.rooms.setBasicMain(main.getComponent("main"));
	
	return quest;
})());
