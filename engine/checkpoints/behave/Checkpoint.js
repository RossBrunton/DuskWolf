//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Checkpoint", (function() {
	var entities = load.require("dusk.entities");
	var checkpoints = load.require("dusk.checkpoints");
	
	/** Checks if the entity is an active checkpoint, and sets a behaviour property if so.
	 * 
	 * This does not actually allow the entity to be used as a checkpoint, see `dusk.checkpoints` on how to do so.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - checkpointName:string - The name of the checkpoint that will be checked.
	 * - checkpointActive:boolean - Whether this is the checkpoint that was last triggered.
	 * 
	 * This is a classless behaviour.
	 */
	var Checkpoint = {
		"checkpointName":"",
		"checkpointActive":false,
		
		"frame":function(entity, e) {
			var room = entity.path("../..")?entity.path("../..").roomName:undefined;
			entity.eProp("checkpointActive",
				checkpoints.isActivated(entity.eProp("checkpointName"), room, entity.comName)
			);
		},
		
		"load":function(entity, e) {Checkpoint.frame(entity, e);}
	};
	
	entities.registerWorkshop("Checkpoint", {
		"help":"Detects if this is an active checkpoint or not.",
		"data":[
			["checkpointName", "string", "Name of the checkpoint to detect if this is active.", "\"\""]
		]
	});
	
	entities.registerBehaviour("Checkpoint", Checkpoint);
	
	return Checkpoint;
})());
