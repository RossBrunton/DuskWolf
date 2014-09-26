//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.plat", (function() {
	var sgui = load.require("dusk.sgui");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var entities = load.require("dusk.entities");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var TileMapWeights = load.require("dusk.tiles.sgui.TileMapWeights");
	var skills = load.require("dusk.skills");
	
	/** Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
	 * 
	 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
	 * @implements dusk.save.ISavable
	 */
	var plat = {};
	
	//Default skills
	skills.giveSkill("jump");
	skills.giveSkill("dubjump");
	//skills.giveSkill("infinijump");
	
	var main = sgui.getPane("plat");
	main.modifyComponent([{"name":"main", "type":"LayeredRoom", "width":-2, "height":-2, "scrollInstantly":true}]);
	main.becomeActive();
	main.flow("main");
	
	entities.types.createNewType("plat", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"src":"pimg/hero.png", "solid":true, "collides":true
		},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
	
	plat.rooms = new RoomManager("dusk.rooms.plat", "rooms");
	plat.rooms.setLayeredRoom(main.getComponent("main"));
	
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
})());
