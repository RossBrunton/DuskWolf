//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.plat", (function() {
	var sgui = load.require("dusk.sgui");
	var BasicMain = load.require("dusk.sgui.BasicMain");
	var entities = load.require("dusk.entities");
	var RoomManager = load.require("dusk.RoomManager");
	var TileMapWeights = load.require("dusk.sgui.TileMapWeights");
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
	main.modifyComponent([{"name":"main", "type":"BasicMain", "width":-2, "height":-2, "scrollInstantly":true}]);
	main.becomeActive();
	main.flow("main");
	
	plat.weights = new TileMapWeights(2, 10);
	plat.weights.addSolid(1, 0, true);
	
	main.getComponent("main").layers = [
		{"name":"back", "type":BasicMain.LAYER_TILEMAP},
		{"name":"scheme", "type":BasicMain.LAYER_SCHEME, "weights":plat.weights},
		{"name":"entities", "type":BasicMain.LAYER_ENTITIES, "primary":true},
		{"name":"parts", "type":BasicMain.LAYER_PARTICLES},
		{"name":"over", "type":BasicMain.LAYER_TILEMAP},
		{"name":"transitions", "type":BasicMain.LAYER_TRANSITIONS}
	];
	
	entities.types.createNewType("plat", {
		"data":{
			"headingLeft":false, "headingUp":false,
			"src":"pimg/hero.png", "solid":true, "collides":true
		},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
	
	plat.rooms = new RoomManager("dusk.plat", "rooms");
	plat.rooms.setBasicMain(main.getComponent("main"));
	
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
