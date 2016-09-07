//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.MarkTrigger", function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** Allows interacting with marks.
	 * 
	 * Simply put, whenever an entity with this behaviour enters a tile with a source y coordinate of 1 on the schematic
	 * layer, `MarkTrigger.onTrigger` will fire. This event can also be fired again by pressing the up key. This can
	 * be used, for example, by `dusk.rooms.RoomTransitions` to switch rooms.
	 * 
	 * The event object contains the following properties:
	 * - up:boolean - Whether the up key was pressed.
	 * - mark:integer - The source y coordinate of the tile triggered.
	 * - activator:string - The name of the entity that activated the mark.
	 * - entity:dusk.entities.sgui.Entity - The entity itself that activated the mark.
	 * - room:string - The name of the room that was activated.
	 * 
	 * This behaviour does not use any behaviour properties.
	 * 
	 * @param {dusk.entities.sgui.Entity} entity The entity this behaviour will act with.
	 * @constructor
	 * @memberof dusk.entities.behave
	 * @extends dusk.entities.behave.Behave
	 */
	class MarkTrigger extends Behave {
		constructor(entity) {
			super(entity);
			
			/** The current mark the entity is at, so that it isn't triggered twice in a row, or as soon as the room loads.
			 * @type integer
			 * @private
			 */
			this._markAt = -1;
			/** The time between mark event firing. No idea why this is needed, but it's here.
			 * @type integer
			 * @private
			 */
			this._coolDown = 5;
			
			// Initial mark at
			var t = this._entity.scheme && this._entity.scheme.tilePointIn(
				this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
			);
			
			if(t && t[1] == 1) {
				this._markAt = t[0];
			}
			
			if(t) TileMap.tileData.free(t);
			
			this.entityEvent.listen(this._frame.bind(this), "frame");
		}
		
		/** Used to handle frame events.
		 * @param {object} e The event.
		 * @private
		 */
		_frame(e) {
			if(this._coolDown) this._coolDown --;
			
			if(!this._entity.scheme) return;
			
			// Get the tile the entity is in
			var t = this._entity.scheme.tilePointIn(
				this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
			);
			
			// Clear the mark we are currently at if we are not at a mark
			if(t[1] != 1) {
				this._markAt = -1;
			}
			
			// And if we are at a mark, fire the event
			if(t[1] == 1 && t[0] != this._markAt) {
				this._markAt = t[0];
				
				if(!this._coolDown) {
					var eob = {
						"up":false, "mark":this._markAt, "activator":this._entity.name, "entity":this._entity,
						"room":this._entity.path("../..").roomName
					}
					entities.markTrigger.fire(eob, this._markAt);
					MarkTrigger.onTrigger.fire(eob, this._markAt);
					this._coolDown = 5;
				}
			}
			
			// Free the tile
			TileMap.tileData.free(t);
		}
	}
	
	/** The event dispatcher fired when a mark is triggered.
	 * @type dusk.utils.EventDispatcher
	 * @since 0.0.21-alpha
	 */
	MarkTrigger.onTrigger = new EventDispatcher("dusk.entities.behave.MarkTrigger.onTrigger");
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
	 * @static
	 */
	MarkTrigger.workshopData = {
		"help":"Will trigger marks on the scheme layer.",
		"data":[
			
		]
	};
	
	entities.registerBehaviour("MarkTrigger", MarkTrigger);
	
	return MarkTrigger;
});
