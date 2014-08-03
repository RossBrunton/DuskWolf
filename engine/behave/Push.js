//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Push", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
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
	 */
	var Push = {
		"pspeed":1,
		
		"collidedInto":function(ent, e) {
			switch(e.dir) {
				case c.DIR_DOWN: ent.applyDy("push_push", -ent.eProp("pspeed"), 1);break;
				case c.DIR_UP: ent.applyDy("push_push", ent.eProp("pspeed"), 1);break;
				case c.DIR_RIGHT: ent.applyDx("push_push", -ent.eProp("pspeed"), 1);break;
				case c.DIR_LEFT: ent.applyDx("push_push", ent.eProp("pspeed"), 1);break;
			}
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
})());


load.provide("dusk.behave.Fall", (function() {
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
	 */
	var Fall = {
		"fallSpeed":1,
		
		"collidedInto": function(ent, e) {
			if(e.dir !== c.DIR_UP) return;
			//ent.performMotion(0, ent.eProp("fallSpeed"));
			ent.applyDy("fall_fall", ent.eProp("fallSpeed"));
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
})());
