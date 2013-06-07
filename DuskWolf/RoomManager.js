//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk.RoomManager");
dusk.load.provide("dusk.editor");

/*  @namespace dusk.rooms
 * @name dusk.rooms
 * 
 * @description This namespace contains rooms for the various game engines.
 * 
 * Essentially, rooms consists of a room in which entities roam about in.
 * 
 * The main game area consists of four "layers".
 * 	The first layer is the schematic layer, 
 *   which describes how entities react to certain tiles in a general sense, for example, walls.
 * 	The second layer is the background layer, which is a tilemap (`{@link dusk.sgui.EditableTileMap}`)
 *   which describes what the backgroud is to look like.
 * 	The third layer is the entity layer, this is the layer on which the entities live and act.
 * 	The fourth layer is an "above the entities" layer, it describes what the foreground is to look like,
 *   and appears over the entities.
 * 
 * The schematic layer is a normal tilemap, which is invisible.
 *  Each tile on the map describes how entities should interact with it, as such:
 * 
 * - [0, 0] Air, the entity will go through this as normal, and nothing happens.
 * - [1, 0] Wall, the entity cannot enter this tile.
 * - [1, 0] - [1, 9] Marks, when the entity touches this (or the player is in it and presses up)
 *  and has the `{@link dusk.behave.MarkTrigger}` behaviour, `{@link dusk.plat.markTrigger}` will fire an event.
 * 
 * The background and foreground layer (named `back` and `over`) are normal, visible tilemaps.
 * 
 * Maps themselves are described using objects with `{@link dusk.rooms.createRoom}`.
 * 	The object must contain the following properties:
 * 
 * - `overSrc`, `backSrc`: The image for the respective layer, must be usable by a tilemap.
 * - `rows`, `cols`: The dimensons of the map.
 * - `back`, `over`, `scheme`: The actual tilemaps of the respective layer. Must be a valid tilemap map.
 * - `entities`: The entities in the map. It is an array,
 *  each element is an object containing `name` (the entity's name), `type` (the entity's type),
 *  `x` and `y` (the entities location).
 * 
 * @since 0.0.16-alpha
 */

dusk.RoomManager = function(packageName, managerPath) {
	/** All the rooms that have been created and added.
	 * 
	 * This is an object containing objects. The key is the name of the room.
	 * @type object
	 * @private
	 */
	this._rooms = {};

	/** An event dispatcher which fires when a room is loaded.
	 * 
	 * This is fired by `{@link dusk.rooms.setRoom}`, and has the properties `"room"`;
	 *  the name of the room, and `"spawn"` the mark number of the spawn point.
	 * @type dusk.EventDispatcher
	 */
	this.roomLoaded = new dusk.EventDispatcher("dusk.RoomManager.roomLoaded");
	
	this.basicMain = null;
	
	this.packageName = packageName;
	this.managerPath = managerPath;
};

/** Stores a room.
 * 
 * @param {string} name The name of the room.
 * @param {object} data The room data to store.
 */
dusk.RoomManager.prototype.createRoom = function(name, data) {
	this._rooms[name] = data;
};

/** Returns a room stored under the specified name.
 * 
 * @param {string} name The name to look up.
 * @return {object} The stored room with that name.
 */
dusk.RoomManager.prototype.getRoomData = function(name) {
	return this._rooms[name];
};

/** Asks the room manager to set a room, with the "seek" entitiy at the mark specified.
 * @param {string} room The name of the room to load.
 * @param {integer} spawn The mark ID for the seek entity to appear at.
 */
dusk.RoomManager.prototype.setRoom = function(room, spawn) {
	if(!room) {
		console.error("No room specified to set!");
		return;
	}
	if(!this.basicMain) {
		console.error("No BasicMain to set the room!");
		return;
	}
	console.log("Setting room "+room);
	
	this.basicMain.createRoom(room, spawn);
	this.roomLoaded.fire({"room":room, "spawn":spawn});
};

dusk.RoomManager.prototype.setBasicMain = function(bm) {
	this.basicMain = bm;
	bm.roomManager = this;
};

Object.seal(dusk.RoomManager);
Object.seal(dusk.RoomManager.prototype);

// ----

/** @namespace dusk.editor
 * @name dusk.editor
 * 
 * @description Provides configuration variables for level editing using `{@link dusk.sgui.BasicMain}`.
 * 
 * It is expected that HTML buttons and simple scripts on such (or just the console) would edit the properties of this.
 * 
 * @since 0.0.16-alpha
 */

/** Whether the editor is active.
 * 
 * If true, then entities will stop running, and the editing components gain focus.
 * 
 * @type boolean
 * @default false
 */
dusk.editor.active = false;

/** The names of the entity types that the number keys will drop if editing is enabled
 *  and the `{@link dusk.sgui.EntityGroup}` has focus.
 * 
 * The array index corresponds to the number of the key, pressing 0 will drop the entity at index 0, for example.
 * 
 * @type array
 */
dusk.editor.editDroppers = [];

/** The name of the next entity that will be dropped.
 * 
 * Once that Entity is dropped, then this will be reset to `""`.
 *  If it is `""`, then the next entity will have a unique but not specified name.
 * 
 * @type string
 */
dusk.editor.editNext = "";

Object.seal(dusk.editor);
