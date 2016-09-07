//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.editor", function() {
	/** Provides configuration variables for level editing using `{@link dusk.rooms.sgui.LayeredRoom}`.
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
	 *  and the `{@link dusk.entities.sgui.EntityGroup}` has focus.
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
	
	return editor;
});

load.provide("dusk.rooms.RoomManager", function() {
	var load = window.load.require("load");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var editor = load.require("dusk.rooms.editor");
	var dusk = load.require("dusk");
	var RoomTransitions = load.require("dusk.rooms.RoomTransitions");
	
	/** Manages rooms, which contain tilemap data and the entities in the room.
	 * 
	 * This is intended to be used with an instance of `{@link dusk.rooms.sgui.LayeredRoom}` and essentially serves as a
	 *  storage for its rooms. Both `{@link dusk.rooms.plat}` and `{@link dusk.rooms.quest}` have their own room
	 *  managers for their own types of rooms.
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
		this._rooms = new Map();

		/** An event dispatcher which fires when a room is loaded.
		 * 
		 * This has the properties `"room"`; the name of the room, and `"spawn"` the mark number of the spawn point.
		 * @type dusk.utils.EventDispatcher
		 */
		this.roomLoaded = new EventDispatcher("dusk.rooms.RoomManager.roomLoaded");
		
		/** The LayeredRoom instance this manager is for.
		 * 
		 * You should use `{@link dusk.rooms.RoomManager#setLayeredRoom}` to set this, instead of setting it directly.
		 * @type dusk.rooms.sgui.LayeredRoom
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
		
		/** The transitions for the current room.
		 * @type dusk.rooms.RoomTransitions
		 * @since 0.0.21-alpha
		 */
		this.currentTransitions = null;
	};
	
	/** Stores a room.
	 * 
	 * @param {string} name The name of the room.
	 * @param {object} data The room data to store.
	 */
	RoomManager.prototype.createRoom = function(name, data) {
		this._rooms.set(name, data);
	};
	
	/** Returns a room stored under the specified name.
	 * 
	 * @param {string} name The name to look up.
	 * @return {promise(object)} A promise that resolves to the given room.
	 */
	RoomManager.prototype.getRoomData = function(name) {
		if(this._rooms.has(name)) {
			return Promise.resolve(this._rooms.get(name));
		}else{
			return load.import(name).then((function(p) {
				this._rooms.set(name, p);
				return p;
			}).bind(this));
		}
	};
	
	/** Asks the basic main to set a room, with the "seek" entitiy at the mark specified.
	 * 
	 * @param {string} room The name of the room to load.
	 * @param {?integer} spawn The mark ID for the seek entity to appear at.
	 * @param {boolean=false} callNewRoom Whether to call the "newRoom" method of the room transitions, which may be
	 *  required to do effects.
	 * @return {promise(object)} A promise that fulfills when the room has finished loading. The value is an object
	 *  containing `room` and `spawn`.
	 */
	RoomManager.prototype.setRoom = function(room, spawn, callNewRoom) {
		if(!room) {
			console.error("No room specified to set!");
			return;
		}
		if(!this.basicMain) {
			console.error("No LayeredRoom to set the room!");
			return;
		}
		console.log("Setting room "+room);
		
		return this.getRoomData(room).then((function(roomData) {
			if(this.currentTransitions) this.currentTransitions.destroy();
			this.currentTransitions = new RoomTransitions(roomData.transitions, room, this);
			
			var prom = this.basicMain.createRoom(room, spawn);
			
			if(callNewRoom) {
				prom = prom.then(this.currentTransitions.newRoom.bind(this.currentTransitions));
			}
			
			return prom.then((function(e) {
				this.roomLoaded.fire({"room":room, "spawn":spawn}, room);
				return {"room":room, "spawn":spawn};
			}).bind(this));
		}).bind(this));
	};
	
	/** Sets the Basic Main instance this is for; this should be called instead of setting it directly.
	 * @param {dusk.rooms.sgui.LayeredRoom} bm The Basic Main instance.
	 */
	RoomManager.prototype.setLayeredRoom = function(bm) {
		this.basicMain = bm;
		bm.roomManager = this;
	};
	
	/** Sets the Basic Main instance this is for; this should be called instead of setting it directly.
	 * @param {dusk.rooms.sgui.LayeredRoom} bm The Basic Main instance.
	 */
	RoomManager.prototype.export = function(name) {
		if(!editor.active) {
			console.warn("Tried to export a room while the editor is disabled.");
			return;
		}
		
		if(!name) name = prompt("Please enter a package name.", this.basicMain.roomName);
		
		console.log("----- Exported Room Data "+name+" -----");
		var deps = ["dusk.entities"];
		
		var out = "";
		out += "// Code generated by RoomManager from DuskWolf "+dusk.ver+" for room "+name;
		out += "\n\"use strict\";\n\n";
		
		out += "load.provide(\""+name+"\", function() {";
		
		var addDep = function(str) {
			if(!deps.includes(str)) deps.push(str);
		};
		
		var room = this.basicMain.saveRoom(addDep);
		room.transitions = this.currentTransitions.export();
		
		out += "\n\tvar manager = load.require(\""+this.packageName+"\")";
		if(this.managerPath) out += "."+this.managerPath;
		out += ";";
		
		for(var i = 0; i < deps.length; i ++) {
			out += "\n\tload.require(\""+deps[i]+"\");";
		}
		
		out += "\n\t";
		out += "\n\tvar room = "+JSON.stringify(room, undefined, 0)+";\n\t";
		out += "\n\tmanager.createRoom(\""+name+"\", room);\n\t";
		out += "\n\t//Remember to add extra code!\n\t";
		
		out += "\n\treturn room;";
		out += "\n});";
		
		console.log(out);
		console.log("----- End Exported Room Data -----");
		
		return false;
	};
	
	return RoomManager;
});
