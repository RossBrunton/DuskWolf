//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.plat", function() {
	var sgui = load.require("dusk.sgui");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	load.require("dusk.rooms.sgui.EditableLayeredRoom");
	var entities = load.require("dusk.entities");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var skills = load.require("dusk.skills");
	var StandardActor = load.require("dusk.rooms.actors.Standard");
	load.require("dusk.sgui.extras.Fade");
	
	/** Plat is a simple platforming engine that uses `dusk.sgui`.
	 * 
	 * Use `make` to add a child to a component to have a platformer engine run in it.
	 * @implements dusk.save.ISavable
	 * @memberof dusk.rooms
	 * @namespace
	 */
	var plat = {};
	
	//Default skills
	skills.giveSkill("jump");
	skills.giveSkill("dubjump");
	//skills.giveSkill("infinijump");
	
	entities.types.createNewType("plat", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"src":"pimg/hero.png tiles:32x32", "solid":true, "collides":true
		},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
	
	plat.rooms = new RoomManager("dusk.rooms.plat", "rooms");
	
	plat.make = function(component, name, layers, twidth, theight) {
		component.modifyComponent(
			[{"name":name, "type":"EditableLayeredRoom", "scrollInstantly":true, "twidth":twidth, "theight":theight,
				"allowMouse":true,
				extras:{
					fadeOut:{
						type:"Fade",
						noDelete:true,
						from:1.0,
						to:0.0,
						duration:30,
					},
					fadeIn:{
						type:"Fade",
						noDelete:true,
						from:0.0,
						to:1.0,
						duration:30,
					}
				}
			}]
		);
		component.becomeActive();
		component.flow(name);
		plat.rooms.setLayeredRoom(component.get(name));
		component.get(name).layers = layers;
		
		var out = {};
		out.tileProperties = component.get(name).tileProperties;
		out.standardActor = new StandardActor(component.get(name));
		out.layeredRoom = component.get(name);
		return out;
	}
	
	plat.save = function(type, args, ref) {
		if(this.rooms.basicMain.getSeek() && type == "roomAndSeek") {
			return [this.rooms.basicMain.roomName, this.rooms.basicMain.getSeek().x, this.rooms.basicMain.getSeek().y];
		}else if(type == "roomOnly" || type == "roomAndSeek"){
			return [this.rooms.basicMain.roomName];
		}else{
			throw TypeError("Type must be either 'roomAndSeek' or 'roomOnly', got "+type);
		}
	};
	
	plat.load = function(data, type, args, unref) {
		if(data.length > 1) {
			return this.rooms.basicMain.createRoom(data[0], [data[1], data[2]]);
		}else{
			return this.rooms.basicMain.createRoom(data[0]);
		}
	};
	
	return plat;
});
