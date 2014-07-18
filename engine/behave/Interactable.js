//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.InteractableTarget", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
	/* * 
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var InteractableTarget = function(entity) {
		Behave.call(this, entity);
		
		this._data("interactType", "", true);
		this._data("interactUpRequired", false, true);
		
		this.entityEvent.listen(_interactedWith.bind(this), "interactedWith");
	};
	InteractableTarget.prototype = Object.create(Behave.prototype);
	
	var _interactedWith = function(e) {
		if(!e.up || !this._data("interactUpRequired")) {
			InteractableTarget.interact.fire(
				{
					"type":this._data("interactType"), "comName":this._entity.comName, "interacter":e.interacter,
					"target":this._entity, "up":e.up
				}, this._data("interactType")
			);
		}
	};
	
	InteractableTarget.interact = new EventDispatcher("dusk.behave.InteractableTarget.interact");
	
	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	InteractableTarget.workshopData = {
		"help":"Can be interacted with to cause events.",
		"data":[
			["interactType", "string", "The interaction type which will be fired with the handler.", ""],
			["interactUpRequired", "boolean", "If true, then the interaction will only be fired when this is interacted\
			 with the 'interact' control.", "false"]
		]
	};
	
	entities.registerBehaviour("InteractableTarget", InteractableTarget);
	
	return InteractableTarget;
})());


load.provide("dusk.behave.InteractableHost", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var controls = load.require("dusk.input.controls");
	
	/* * 
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var InteractableHost = function(entity) {
		Behave.call(this, entity);
		
		this._interactingWith = [];
		this._controlActiveActive = false;
		
		this.entityEvent.listen(_frame.bind(this), "frame");
	};
	InteractableHost.prototype = Object.create(Behave.prototype);
	
	var _frame = function(e) {
		var touchers = this._entity.allTouchers();
		
		var active = false;
		if(this._controlActiveActive) {
			if(!this._controlActive("interact")) this._controlActiveActive = false;
		}else{
			if(this._controlActive("interact")) {
				this._controlActiveActive = true;
				active = true;
			}
		}
		
		for(var i = 0; i < touchers.length; i ++) {
			if(this._interactingWith.indexOf(touchers[i]) === -1) {
				if(touchers[i] !== "wall") {
					touchers[i].behaviourFire("interactedWith", {"up":false, "interacter":this._entity});
				}
			}
			
			if(active) {
				if(touchers[i] !== "wall") {
					touchers[i].behaviourFire("interactedWith", {"up":true, "interacter":this._entity});
				}
			}
		}
		
		this._interactingWith = touchers;
	};
	
	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	InteractableHost.workshopData = {
		"help":"Can interact with interactable entities.",
		"data":[
			
		]
	};
	
	controls.addControl("entity_interact", "UP", 3);
	
	entities.registerBehaviour("InteractableHost", InteractableHost);
	
	return InteractableHost;
})());
