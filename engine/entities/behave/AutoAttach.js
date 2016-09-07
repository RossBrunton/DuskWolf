//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.AutoAttach", function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var Entity = load.require("dusk.entities.sgui.Entity");
	var utils = load.require("dusk.utils");
	var EntityGroup = load.suggest("dusk.entities.sgui.EntityGroup", function(p) {EntityGroup = p});
	
	// Name counter
	var aaCounter = 0;
	
	/** An entity with this behaviour will create a new entity and attach it to itself when it loads.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - attachType = "" - The type of the entity to create and attach.
	 * 
	 * This is a classless behaviour.
	 * @memberof dusk.entities.behave
	 */
	var AutoAttach = {
		typeChange: function(entity, e) {
			if(!(EntityGroup && entity.container instanceof EntityGroup))
				return;
			
			aaCounter ++;
			var ent = {"type":entity.eProp("attachType"), "x":0, "y":0, "name":"AutoAttach_"+aaCounter};
			
			//Now drop a real entity at those coordinates
			var dropped = entity.container.dropEntity(ent);
			
			entity.attach(dropped);
		}
	}
	
	entities.registerWorkshop("AutoAttach", {
		"help":"Automatically creates and attaches an entity",
		"data":[
			["attachType", "string", "The entity type to automatically attach", "\"\""]
		]
	});
	
	entities.registerBehaviour("AutoAttach", AutoAttach);
	
	return AutoAttach;
});


load.provide("dusk.entities.behave.TermOnAttachParentDie", function() {
	var entities = load.require("dusk.entities");
	
	/** An entity with this behaviour will be terminated if its attached parent dies.
	 * 
	 * This is a classless behaviour.
	 * @memberof dusk.entities.behave
	 */
	var TermOnAttachParentDie = {
		"attachParentDie":function(entity, e) {
			entity.terminate();
		},
	};
	
	// Add the behaviour
	entities.registerBehaviour("TermOnAttachParentDie", TermOnAttachParentDie);
	
	entities.registerWorkshop("TermOnAttachParentDie", {
		"help":"Automatically terminates this entity if its attached parent is deleted",
		"data":[]
	});
	
	return TermOnAttachParentDie;
});
