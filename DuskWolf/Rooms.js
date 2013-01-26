//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk.rooms");
dusk.load.provide("dusk.editor");

/** @namespace dusk.rooms
 * @name dusk.rooms
 * 
 * @description This namespace contains rooms for the various game engines.
 * 
 * The definition of room may vary, but this will store them, as objects.
 * 
 * The intent of this namespace is to allow game code to store rooms, and reference them via strings when setting them.
 * 
 * @since 0.0.16-alpha
 */

/** All the rooms that have been created and added.
 * 
 * This is an object containing objects. The key is the name of the room.
 * 
 * @type object
 * @private
 */
dusk.rooms._rooms = {};

/** An event dispatcher which fires when a room is loaded.
 * 
 * This is fired by the namespace which manages rooms (Such as `{@link dusk.plat}`), which decides what the properties of the event object are.
 * 
 * @type dusk.EventDispatcher
 */
dusk.rooms.roomLoaded = new dusk.EventDispatcher("dusk.rooms.roomLoaded");

/** Stores a room.
 * 
 * @param {string} name The name of the room.
 * @param {object} data The room data to store.
 */
dusk.rooms.createRoom = function(name, data) {
	this._rooms[name] = data;
};

/** Returns a room stored under the specified name.
 * 
 * @param {string} name The name to look up.
 * @return {object} The stored room with that name.
 */
dusk.rooms.getRoomData = function(name) {
	return this._rooms[name];
};

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

/** The names of the entity types that the number keys will drop if editing is enabled and the `{@link dusk.sgui.EntityGroup}` has focus.
 * 
 * The array index corresponds to the number of the key, pressing 0 will drop the entity at index 0, for example.
 * 
 * @type array
 */
dusk.editor.editDroppers = [];

/** The name of the next entity that will be dropped.
 * 
 * Once that Entity is dropped, then this will be reset to `""`. If it is `""`, then the next entity will have a unique but not specified name.
 * 
 * @type string
 */
dusk.editor.editNext = "";
