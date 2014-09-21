//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Gravity", (function() {
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	
	/** An entity with this behaviour will move down at a constant acceleration.
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
		"gravity":1.5,
		"terminal":7,
		
		"verForce":function(entity, e) {
			return [entity.eProp("gravity"), entity.eProp("terminal"), "Gravity"];
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


load.provide("dusk.behave.Buoyancy", (function() {
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	
	/** An entity with this behaviour will move upwards at a speed when submerged in a liquid.
	 * 
	 * The acceleration is given by the behaviour property `"buoyancy"`, which is an object with the fluid name being
	 *  the key, and the maximum speed is given by `"terminal"` in the same format.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - buoyancy:object = {} - Acceleration due to buoyancy; keys are 
	 * - terminal:object = {} - Maximum speed that buoyancy applies.
	 * 
	 * This is a classless behaviour.
	 */
	var Buoyancy = {
		"buoyancy":{},
		"terminalBuoyancy":{},
		"buoyancyCentre":16,
		
		"verForce":function(entity, e) {
			if(entity.fluid && entity.fluid.fluidType in entity.eProp("buoyancy")) {
				if(entity.underFluid(-entity.eProp("buoyancyCentre")) > 0.0) {
					var upforce = -entity.eProp("buoyancy")[entity.fluid.fluidType];
					//upforce *= entity.underFluid(-entity.eProp("buoyancyCentre"));
					
					var limit = entity.eProp("terminalBuoyancy")[entity.fluid.fluidType];
					
					if(entity.dy <= entity.eProp("gravity")
					&& entity.underFluid(-entity.eProp("buoyancyCentre")) < 1.0
					&& limit > entity.height * entity.underFluid(-entity.eProp("buoyancyCentre"))) {
						
						limit = entity.height * entity.underFluid(-entity.eProp("buoyancyCentre"));
					}
					
					return [
						upforce, limit, "buoyancy"
					];
				}else{
					return [0, 0, "buoyancy"];
				}
			}
		},
	};
	
	entities.registerWorkshop("Buoyancy", {
		"help":"Will accelerate upwards when in a fluid.",
		"data":[
			["buoyancy", "object", "Acceleration by buoyancy for a given fluid."],
			["terminalBuoyancy", "object", "Fastest speed for buoyancy for a given fluid."],
		]
	});
	
	entities.registerBehaviour("Buoyancy", Buoyancy);
	
	return Buoyancy;
})());
