//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.simpleGui");
dusk.load.require("dusk.sgui.PlatMain");
dusk.load.require("dusk.sgui.CentreScroller");
dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk.plat");

/** @namespace dusk.plat
 * @name dusk.plat
 * 
 * @description Plat is a simple platforming engine that uses `{@link dusk.simpleGui}`.
 * 
 * Essentially, it consists of a room in which entities roam about in.
 * 
 * The main game area consists of four "layers".
 * 	The first layer is the schematic layer, which describes how entities react to certain tiles in a general sense, for example, walls.
 * 	The second layer is the background layer, which is a tilemap (`{@link dusk.sgui.EditableTileMap}`) which describes what the backgroud is to look like.
 * 	The third layer is the entity layer, this is the layer on which the entities live and act.
 * 	The fourth layer is an "above the entities" layer, it describes what the foreground is to look like, and appears over the entities.
 * 
 * The schematic layer is a normal tilemap, which is invisible. Each tile on the map describes how entities should interact with it, as such:
 * 
 * - [0, 0] Air, the entity will go through this as normal, and nothing happens.
 * - [1, 0] Wall, the entity cannot enter this tile.
 * - [1, 0] - [1, 9] Marks, when the entity touches this (or the player is in it and presses up) and has the `{@link dusk.behave.MarkTrigger}` behaviour, `{@link dusk.plat.markTrigger}` will fire an event.
 * 
 * The background and foreground layer (named `back` and `over`) are normal, visible tilemaps.
 * 
 * Entities exist on the entity layer (`{@link dusk.sgui.EntityGroup}`), and are objects of type `{@link dusk.sgui.PlatEntity}`.
 * 	Entities are described using types, each entity has only one type, which describes how they act, their data and animations.
 * 	Entity types are simple objects with three properties, `data`, `animation` and `behaviours`.
 * 
 * 
 * Entity types are set using `{@link dusk.plat.modifyEntityType}`, which allows you to specify an entity to inherit from.
 * 	This means you can make an entity type that shares the same properties of another type easily.
 * 
 * The `data` property describes data used by the entity by its behaviours to do something.
 * 	If a property used by a behaviour is not in this object, it will be created automatically by the behaviour.
 * 	This is a standard object.
 * 
 * The `animation` property describes animation.
 * 	It is an object, the key names are animation names with optional flags (in the form `"name-flag"`), and the values are data that is used by the animation system, in frames seperated by "|".
 * 	Flags are specified when setting the animation as an array of strings, if the animation name and any flag (ones at the start of the array have priority) matches a key, then that animation will run.
 * 	Flags are optional, in that if no flags match, but the name (with no flags) does, then that animation will run.
 * 
 * The `behaviours` property describes how the entity should behave.
 *	It is an object with keys being names of behaviours (Entries in `{@link dusk.behaviours}` and subcasses of `{@link dusk.behaviours.Behave}`), and the values being booleans describing whether that behaviour is active or not.
 *	A behaviour essentially controlls how the entity acts in relation to the environment and other entities.
 * 
 * 
 * Maps themselves are described using objects with `{@link dusk.plat.createRoom}`.
 * 	The object must contain the following properties:
 * 
 * - `overSrc`, `backSrc`: The image for the respective layer, must be usable by a tilemap.
 * - `rows`, `cols`: The dimensons of the map.
 * - `back`, `over`, `scheme`: The actual tilemaps of the respective layer. Must be a valid tilemap map.
 * - `entities`: The entities in the map. It is an array, each element is an object containing `name` (the entity's name), `type` (the entity's type) `x` and `y` (the entities location).
 * 
 * 
 * The player has so called `skills`, which describe what abilities the player has (such as jumping and double jumping).
 * 
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
dusk.plat._init = function() {
	//Vars
	/** All the current skills that the player has.
	 * 
	 * @type array
	 * @private
	 */
	this._skills = [];
	this.giveSkill("jump");
	this.giveSkill("dubjump");
	//this.giveSkill("infinijump");
	
	/** Sprite size of binary entities and tilemap tiles.
	 * 
	 * If the mode is binary, then this is considered to be the width and height of the tiles when reading them from the image.
	 * 
	 * This should be `n` such that the width and height of the sprite is `2^n`. If this is 4, then the sprites will be 16x16, for example.
	 * 
	 * @type number
	 * @default 4
	 */
	this.ssize = 4;
	/** Sprite width of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the width of tiles when reading them from the image.
	 * 
	 * @type number
	 * @default 16
	 */
	this.swidth = 16;
	/** Sprite height of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the height of tiles when reading them from the image.
	 * 
	 * @type number
	 * @default 16
	 */
	this.sheight = 16;
	
	/** Tile size of binary entities and tilemap tiles.
	 * 
	 * If the mode is binary, then this is considered to be the width and height of the tiles when drawing them to the canvas.
	 * 
	 * This should be `n` such that the width and height of the tile to draw is `2^n`. If this is 4, then the sprites will be 16x16, for example.
	 * 
	 * @type number
	 * @default 5
	 */
	this.tsize = 5;
	this.twidth = 32;
	this.theight = 32;
	
	this.mode = "BINARY";
	
	this.seek = "hero";
	this.seekType = "player";
	
	this.editing = false;
	this.editDroppers = [];
	this.editNext = "";
	
	this._rooms = {};
	
	this.roomLoaded = new dusk.EventDispatcher("dusk.plat.roomLoaded");
	this.markTrigger = new dusk.EventDispatcher("dusk.plat.markTrigger");
	this.persistDataUpdate = new dusk.EventDispatcher("dusk.plat.persistDataUpdate");
	
	this._persistData = {};
	
	this._entityData = {};
	this._entityData["default"] = {
		"data":{"hp":1, "gravity":1, "terminal":9, "haccel":2, "hspeed":7, "jump":15, "slowdown":1, "img":"pimg/hero.png", "solid":true, "anchor":false},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	};
	
	var main = dusk.simpleGui.getPane("plat-main");
	main.modifyChildren({"name":"mainContainer", "focus":"main", "type":"CentreScroller", "width":dusk.simpleGui.width, "height":dusk.simpleGui.height, "child":{"name":"main", "type":"PlatMain"}});
	main.active = true;
	main.focus = "mainContainer";
};

dusk.plat.createRoom = function(name, data) {
	this._rooms[name] = data;
};

dusk.plat.getRoomData = function(name) {
	return this._rooms[name];
};

/*- Function: _setRoom
 * 
 * Used internally to handle the "plat-room" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	a			- [object] A "plat-room" action.
 */
dusk.plat.setRoom = function(room, spawn) {
	if(!room) {
		console.error("No room specified to set!");
		return;
	}
	console.log("Setting room "+room);
	
	dusk.simpleGui.getPane("plat-main").path("/mainContainer/main").createRoom(room, spawn);
	this.roomLoaded.fire({"room":room, "spawn":spawn});
	
	/*dusk.actions.run([{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
		{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer", "fade":{"from":1, "end":0, "speed":-0.05}}
	]}], dusk.actions.thread);
	console.log("Setting room "+a.room+".");
	dusk.data.download("prooms/"+a.room.replace(/\-/g, "_")+".json", "text", function(d, s) {
		dusk.actions.run(dusk.utils.jsonParse(d, true), dusk.actions.thread);
		dusk.actions.run([
			{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer/main", "room":a.room, "spawn":a.spawn},
			{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
				{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer", "fade":{"from":0, "end":1, "speed":0.05}}
			]},
			{"a":"fire", "event":"plat-room-load", "room":a.room}], dusk.actions.thread);
	});*/
};

dusk.plat.modifyEntityType = function(name, data, inherit) {
	if(inherit !== undefined) {
		this._entityData[name] = dusk.utils.merge(this._entityData[inherit], data);
	}else if(!(name in this._entityData)) {
		this._entityData[name] = dusk.utils.merge(this._entityData["default"], data);
	}else{
		this._entityData[name] = dusk.utils.merge(this._entityData[name], data);
	}
};

dusk.plat.getEntityType = function(name) {
	return this._entityData[name];
};

dusk.plat.giveSkill = function(skillName) {
	if(this._skills.indexOf(skillName) === -1) {
		this._skills.push(skillName);
		return true;
	}else{
		return false;
	}
};

dusk.plat.hasSkill = function(skillName) {
	return this._skills.indexOf(skillName) !== -1;
};

dusk.plat.revokeSkill = function(skillName) {
	if(this._skills.indexOf(skillName) === -1) {
		return false;
	}else{
		this._skills.splice(this._skills.indexOf(skillName), 1);
		return true;
	}
};

dusk.plat.storePersist = function(name, data) {
	this._persistData[name] = data;
	data.entityName = name;
	this.persistDataUpdate.fire(data);
};

dusk.plat.getPersist = function(name) {
	return this._persistData[name];
};

dusk.plat._init();
