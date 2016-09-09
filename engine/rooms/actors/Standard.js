//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Actors for the rooms module.
 *
 * @name actors
 * @namespace
 * @memberof dusk.rooms
 */

load.provide("dusk.rooms.actors.Standard", function() {
	var Runner = load.require("dusk.script.Runner");
	
	/** An actor that contains standard actions for a LayeredRoom
	 * 
	 * @since 0.0.21-alpha
	 * @memberof dusk.rooms.actors
	 */
	class Standard {
		/** Creates a new standard actor
		 * 
		 * @param {dusk.rooms.sgui.LayeredRoom} layeredRoom kAAUAEOUOEUEOU The layered room to act upon.
		 */
		constructor(layeredRoom) {
			this.layeredRoom = layeredRoom;
		}
		
		/** Sets the "playerControl" property of the seek entity to false, so the player can't move it.
		 * @return {object} The action.
		 */
		disableFreeControl() {
			return Runner.action("dusk.rooms.actors.Standard.disableFreeControl", (function(x) {
				x.oldControl = this.layeredRoom.getSeek().eProp("playerControl");
				this.layeredRoom.getSeek().eProp("playerControl", false);
				return Promise.resolve(x);
			}).bind(this), (function(x) {
				this.layeredRoom.getSeek().eProp("playerControl", x.oldControl);
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		/** Sets the "playerControl" property of the seek entity to true, so the player can move it.
		 * @return {object} The action.
		 */
		enableFreeControl() {
			return Runner.action("dusk.rooms.actors.Standard.enableFreeControl", (function(x) {
				x.oldControl = this.layeredRoom.getSeek().eProp("playerControl");
				this.layeredRoom.getSeek().eProp("playerControl", true);
				return Promise.resolve(x);
			}).bind(this), (function(x) {
				this.layeredRoom.getSeek().eProp("playerControl", x.oldControl);
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		/** Sets the "entity", "x" and "y" properties of the passed object to that of the seek entity.
		 * @return {object} The action.
		 */
		getSeek() {
			return Runner.action("dusk.rooms.actors.Standard.getSeek", (function(x) {
				x.entity = this.layeredRoom.getSeek();
				x.x = x.entity.tileX();
				x.y = x.entity.tileY();
				return Promise.resolve(x);
			}).bind(this));
		}
	}
	
	return Standard;
});
