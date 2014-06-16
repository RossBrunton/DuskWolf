//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.RoomManager", (function() {
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
	/** @class dusk.RoomManager
	 * 
	 * @classdesc Manages rooms, which contain tilemap data and the entities in the room.
	 * 
	 * This is intended to be used with an instance of `{@link dusk.sgui.BasicMain}` and essentially serves as a storage 
	 *  for it's rooms. Both `{@link dusk.plat}` and `{@link dusk.quest}` have their own room managers for their own types
	 *  of rooms.
	 * 
	 * @param {?string} packageName The package that this room manager depends on; for generating rooms in the editor.
	 * @param {?string} managerPath The path to this object from it's package.
	 * @constructor
	 * @since 0.0.16-alpha
	 */
	var RoomManager = function(packageName, managerPath) {
		/** All the rooms that have been added.
		 * 
		 * The key is the name of the room, and the value is the room data.
		 * @type object
		 * @private
		 */
		this._rooms = {};

		/** An event dispatcher which fires when a room is loaded.
		 * 
		 * This has the properties `"room"`; the name of the room, and `"spawn"` the mark number of the spawn point.
		 * @type dusk.EventDispatcher
		 */
		this.roomLoaded = new EventDispatcher("dusk.RoomManager.roomLoaded");
		
		/** The BasicMain instance this manager is for.
		 * 
		 * You should use `{@link dusk.RoomManager#setBasicMain}` to set this, instead of setting it directly.
		 * @type dusk.sgui.BasicMain
		 */
		this.basicMain = null;
		
		/** The name of the package that this room manager is from.
		 * @type ?string
		 */
		this.packageName = packageName;
		
		/** Path to this object, from window. For example `"rooms"` or so.
		 * @type ?string
		 */
		this.managerPath = managerPath;
	};

	/** Stores a room.
	 * 
	 * @param {string} name The name of the room.
	 * @param {object} data The room data to store.
	 */
	RoomManager.prototype.createRoom = function(name, data) {
		this._rooms[name] = data;
	};

	/** Returns a room stored under the specified name.
	 * 
	 * @param {string} name The name to look up.
	 * @return {object} The stored room with that name.
	 */
	RoomManager.prototype.getRoomData = function(name) {
		return this._rooms[name];
	};

	/** Asks the basic main to set a room, with the "seek" entitiy at the mark specified.
	 * 
	 * @param {string} room The name of the room to load.
	 * @param {?integer} spawn The mark ID for the seek entity to appear at.
	 */
	RoomManager.prototype.setRoom = function(room, spawn) {
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

	/** Sets the Basic Main instance this is for; this should be called instead of setting it directly.
	 * @param {dusk.sgui.BasicMain} bm The Basic Main instance.
	 */
	RoomManager.prototype.setBasicMain = function(bm) {
		this.basicMain = bm;
		bm.roomManager = this;
	};

	Object.seal(RoomManager);
	Object.seal(RoomManager.prototype);
	
	return RoomManager;
})());

load.provide("dusk.editor", (function() {
	/** @namespace dusk.editor
	 * @name dusk.editor
	 * 
	 * @description Provides configuration variables for level editing using `{@link dusk.sgui.BasicMain}`.
	 * 
	 * It is expected that HTML buttons and simple scripts on such (or just the console) would edit the properties of this.
	 * 
	 * @since 0.0.16-alpha
	 */
	var editor = {};

	/** Whether the editor is active.
	 * 
	 * If true, then entities will stop running, and the editing components gain focus.
	 * 
	 * @type boolean
	 * @default false
	 */
	editor.active = false;

	/** The names of the entity types that the number keys will drop if editing is enabled
	 *  and the `{@link dusk.sgui.EntityGroup}` has focus.
	 * 
	 * The array index corresponds to the number of the key, pressing 0 will drop the entity at index 0, for example.
	 * 
	 * @type array
	 */
	editor.editDroppers = [];

	/** The name of the next entity that will be dropped.
	 * 
	 * Once that Entity is dropped, then this will be reset to `""`.
	 *  If it is `""`, then the next entity will have a unique but not specified name.
	 * 
	 * @type string
	 */
	editor.editNext = "";

	Object.seal(editor);
	
	return editor;
})());
