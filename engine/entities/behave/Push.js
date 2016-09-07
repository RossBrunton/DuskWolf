//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Push", function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var c = load.require("dusk.sgui.c");
	
	/** An entity with this behaviour will, when hit from any direction, 
	 *  will move in that direction a number of pixels specified with the `speed` property.
	 * 
	 * This can be used to make pushable blocks.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - pspeed:integer = 1 - The speed to move when pushed.
	 * 
	 * This is a classless behaviour.
	 * @memberof dusk.entities.behave
	 */
	var Push = {
		"pspeed":1,
		
		"horForce":function(entity, e) {
			if(entity.eProp("_Push_collidedSide") == c.DIR_LEFT) return entity.eProp("pspeed");
			if(entity.eProp("_Push_collidedSide") == c.DIR_RIGHT) return -entity.eProp("pspeed");
		},
		
		"verForce":function(entity, e) {
			if(entity.eProp("_Push_collidedSide") == c.DIR_UP) return entity.eProp("pspeed");
			if(entity.eProp("_Push_collidedSide") == c.DIR_DOWN) return -entity.eProp("pspeed");
		},
		
		"beforeMove":function(entity, e) {
			entity.eProp("_Push_collidedSide", 0);
		},
		
		"collidedInto":function(ent, e) {
			ent.eProp("_Push_collidedSide", e.dir);
		}
	};
	
	entities.registerWorkshop("Push", {
		"help":"Will move when pushed.",
		"data":[
			["pspeed", "integer", "Speed to move when pushed."],
		]
	});
	
	entities.registerBehaviour("Push", Push);
	
	return Push;
});


load.provide("dusk.entities.behave.Fall", function() {
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	
	/** An entity with this behaviour will move down a number of pixels specified by the `fallSpeed` data property when
	 *  landed on.
	 * 
	 * If this value is lower that the speed the entity is falling at, it will appear as if the entity is standing on
	 *  top of this.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - fallSpeed:integer = 1 - The speed to fall at.
	 * 
	 * This is a classless behaviour.
	 * @memberof dusk.entities.behave
	 */
	var Fall = {
		"fallSpeed":1,
		
		"verForce":function(entity, e) {
			if(entity.eProp("falling")) {
				return entity.eProp("fallSpeed");
			}
			return 0;
		},
		
		"collidedInto": function(ent, e) {
			if(e.dir !== c.DIR_UP) return;
			ent.eProp("falling", true);
		}
	};

	entities.registerWorkshop("Fall", {
		"help":"Will fall when collided with.",
		"data":[
			["fallSpeed", "integer", "The speed to fall."]
		]
	});
	
	entities.registerBehaviour("Fall", Fall);
	
	return Fall;
});
