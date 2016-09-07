//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.LimitedLife", function() {
	var entities = load.require("dusk.entities");
	
	/** 
	 * 
	 * This is a classless behaviour.
	 * @memberof dusk.entities.behave
	 */
	var LimitedLife = {
		"lifespan":60,
		
		"frame":function(ent, e) {
			if(ent.eProp("lifespan") <= 0) {
				ent.terminate();
			}
			ent.eProp("lifespan", ent.eProp("lifespan")-1);
		}
	};
	
	entities.registerWorkshop("LimitedLife", {
		"help":"The entity will die after a while.",
		"data":[
			["lifespan", "integer", "Frames for the entity to live for."],
		]
	});
	
	entities.registerBehaviour("LimitedLife", LimitedLife);
	
	return LimitedLife;
});
