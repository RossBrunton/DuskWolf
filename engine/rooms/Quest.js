//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.quest", (function() {
	var sgui = load.require("dusk.sgui");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var entities = load.require("dusk.entities");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var StandardActor = load.require("dusk.rooms.actors.Standard");
	var SelectActor = load.require("dusk.rooms.actors.Select");
	var RegionsActor = load.require("dusk.rooms.actors.Regions");
	
	/* @namespace dusk.rooms.quest
	 * @name dusk.rooms.quest
	 * 
	 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
	 * 
	 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
	 */
	var quest = {};
	
	
	entities.types.createNewType("quest", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"src":"pimg/hero.png", "solid":true, "collides":true
		},
		"animation":["true", "0,0", {}],
		"behaviours":{}
	});
	
	quest.puppeteer = null;
	
	quest.make = function(component, name) {
		component.modifyComponent([{"name":name, "type":"LayeredRoom", "allowMouse":true}]);
		component.becomeActive();
		component.flow(name);
		quest.rooms.setLayeredRoom(component.get(name));
		
		var out = {};
		out.standardActor = new StandardActor(component.get(name));
		out.selectActor = new SelectActor(component.get(name));
		out.regionsActor = new RegionsActor(component.get(name));
		out.layeredRoom = component.get(name);
		
		return out;
	}
	
	quest.rooms = new RoomManager("dusk.rooms.quest", "rooms");
	
	return quest;
})());
