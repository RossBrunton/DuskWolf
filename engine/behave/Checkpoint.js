//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Checkpoint", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var checkpoints = load.require("dusk.checkpoints");
	
	/** Checks if the entity is an active checkpoint, and sets a behaviour property if so.
	 * 
	 * This does not actually allow the entity to be used as a checkpoint, see `dusk.checkpoints` on how to do so.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - checkpointName:string - The name of the checkpoint that will be checked.
	 * - checkpointActive:boolean - Whether this is the checkpoint that was last triggered.
	 * 
	 * @param {dusk.sgui.Entity} entity The entity this behaviour will act with.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var Checkpoint = function(entity) {
		Behave.call(this, entity);
		
		this._data("checkpointName", "", true);
		this._data("checkpointActive", false, true);
		
		this.entityEvent.listen(_frame.bind(this), "frame");
		this.entityEvent.listen(_load.bind(this), "typeChange");
	};
	Checkpoint.prototype = Object.create(Behave.prototype);
	
	/** Manages loading the entity, generally just calls `_frame`.
	 * @param {object} data An event object.
	 * @private
	 */
	var _load = function(e) {
		_frame.call(this, e);
	};
	
	/** Manages every frame, looking up and seeing if the checkpoint is active or not.
	 * @param {object} data An event object.
	 * @private
	 */
	var _frame = function(e) {
		var room = this._entity.path("../..")?this._entity.path("../..").roomName:undefined;
		this._data("checkpointActive",
			checkpoints.isActivated(this._data("checkpointName"), room, this._entity.comName)
		);
	};
	
	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Checkpoint.workshopData = {
		"help":"Detects if this is an active checkpoint or not.",
		"data":[
			["checkpointName", "string", "Name of the checkpoint to detect if this is active.", "\"\""]
		]
	};
	
	entities.registerBehaviour("Checkpoint", Checkpoint);
	
	return Checkpoint;
})());
