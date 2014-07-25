//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Checkpoint", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var checkpoints = load.require("dusk.checkpoints");
	
	var Checkpoint = function(entity) {
		Behave.call(this, entity);
		
		this._data("checkpointName", "", true);
		this._data("checkpointActive", false, true);
		
		this.entityEvent.listen(_frame.bind(this), "frame");
		this.entityEvent.listen(_load.bind(this), "typeChange");
	};
	Checkpoint.prototype = Object.create(Behave.prototype);
	
	var _load = function(data) {
		_frame.call(this, data);
	};
	
	var _frame = function(data) {
		var room = this._entity.path("../..")?this._entity.path("../..").roomName:undefined;
		this._data("checkpointActive",
			checkpoints.isActivated(this._data("checkpointName"), room, this._entity.comName)
		);
	};
	
	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Checkpoint.workshopData = {
		"help":"Improves the checkpoint abilities of dusk.Checkpoint.",
		"data":[
			
		]
	};
	
	entities.registerBehaviour("Checkpoint", Checkpoint);
	
	return Checkpoint;
})());
