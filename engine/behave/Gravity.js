//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Gravity", (function() {
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.behave.Gravity
	 * 
	 * @classdesc An entity with this behaviour will move down at a constant acceleration.
	 * 
	 * The acceleration is given by the behaviour property `"gravity"` (default 2), and the maximum speed is given by
	 * `"terminal"` (default 7).
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - gravity:integer = 2 - Acceleration due to gravity.
	 * - terminal:integer = 7 - Maximum speed that gravity applies.
	 * 
	 * This is a classless behaviour.
	 */
	var Gravity = {
		"gravity":2,
		"terminal":7,
		
		"frame":function(entity, e) {
			if(entity.touchers(c.DIR_DOWN).length) {
				entity.applyDy(
					"gravity", entity.eProp("gravity"), 1, entity.eProp("gravity"), entity.eProp("terminal")
				);
			}else{
				entity.applyDy(
					"gravity", entity.eProp("gravity"), 1, entity.eProp("gravity"), entity.eProp("terminal"), true
				);
			}
		}
	};
	
	entities.registerWorkshop("Gravity", {
		"help":"Will accelerate downwards.",
		"data":[
			["gravity", "integer", "Acceleration by gravity."],
			["terminal", "integer", "Fastest speed for gravity."],
		]
	});
	
	entities.registerBehaviour("Gravity", Gravity);
	
	return Gravity;
})());
