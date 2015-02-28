//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.BackForth", (function() {
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	
	/** An entity with this behaviour will move in one direction until it collides with something, and then head
	 * the other direction.
	 * 
	 * The speed it travels at is defined by the behaviour data value `hspeed`. Which is `5` by default.
	 * 
	 * If the behaviour property `backforthif` is non-empty, then this entity will only move back and forth if that
	 *  trigger is true.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - hspeed:integer = 5 - The speed to move.
	 * - backforthif:string = "" - If this trigger is true for this entity, the entity won't switch direction.
	 * 
	 * This is a classless behaviour.
	 */
	var BackForth = {
		"hspeed":5,
		"backforthif":"",
		
		"horForce":function(entity, e) {
			if(entity.evalTrigger(entity.eProp("backforthif"))) {
				if(entity.eProp("headingLeft")) {
					return -entity.eProp("hspeed");
				}else{
					return entity.eProp("hspeed");
				}
			}
		},
		
		"collide":function(entity, e) {
			if(e.dir == c.DIR_LEFT) {
				entity.eProp("headingLeft", false);
			}
			if(e.dir == c.DIR_RIGHT) {
				entity.eProp("headingLeft", true);
			}
		}
	};
	
	// Help data
	entities.registerWorkshop("BackForth", {
		"help":"Will move side to side and bounce of walls.",
		"data":[
			["hspeed", "integer", "Horizontal speed.", "5"],
			["backforthif", "string", "Will only change direction if this trigger is true.", ""]
		]
	});
	
	// Add the behaviour
	entities.registerBehaviour("BackForth", BackForth);
	
	return BackForth;
})());
