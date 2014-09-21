//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.InteractableTarget", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
	/** Is interacted by from other entities, and then fires a global event handler.
	 * 
	 * If this entity is interacted with it will fire the `interact` event handler with an `interact event` with the
	 *  `interactType` value as the filter.
	 * 
	 * The `interact event` object contains the following properties:
	 * - type:string - The value of `interactType`.
	 * - comName:string - The name of the entity target.
	 * - target:dusk.sgui.Entity - The target entity (this).
	 * - interacter:dusk.sgui.Entity - The entity interacting with this.
	 * - up:boolean - Whether the interaction was due to `entity_interact`.
	 * - room:string - The name of the room, if available.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - interactType:string - The value for the interaction type.
	 * - interactUpRequired:boolean = false - Whether the `entity_interact` control on the sender is requried for the
	 *  event to fire.
	 * 
	 * @param {dusk.sgui.Entity} entity The entity this behaviour will act with.
	 * @constructor
	 * @since 0.0.21-alpha
	 * @see dusk.behave.InteractableHost
	 */
	var InteractableTarget = function(entity) {
		Behave.call(this, entity);
		
		this._data("interactType", "", true);
		this._data("interactUpRequired", false, true);
		
		this.entityEvent.listen(_interactedWith.bind(this), "interactedWith");
	};
	InteractableTarget.prototype = Object.create(Behave.prototype);
	
	/** Handles interactions.
	 * @param {object} e The event object.
	 * @private
	 */
	var _interactedWith = function(e) {
		if(!e.up || !this._data("interactUpRequired")) {
			InteractableTarget.interact.fire(
				{
					"type":this._data("interactType"), "comName":this._entity.comName, "interacter":e.interacter,
					"target":this._entity, "up":e.up,
					"room":this._entity.path("../../")?this._entity.path("../../").roomName:undefined
				}, this._data("interactType")
			);
		}
	};
	
	/** Fired when this entity is interacted with. The properties of the event object are detailed in the documentation
	 *  for the class.
	 * @type dusk.EventDispatcher
	 * @static
	 */
	InteractableTarget.interact = new EventDispatcher("dusk.behave.InteractableTarget.interact");
	
	/** Workshop data used by `dusk.sgui.EntityWorkshop`.
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
	
	/** Can interact with other entities.
	 * 
	 * When this entity collides with another entity (even if it isn't solid), it will fire an `interactedWith` event
	 *  on it. Also, if the `entity_interact` control (default up key) is pressed and this entity has the behaviour
	 *  `dusk.behave.PlayerControl`, another `interactedWith` event will be fired.
	 * 
	 * The `interactedWith` event object contains the following properties:
	 * - up:boolean - Whether the `entity_interact` key was pressed.
	 * - interacter:dusk.sgui.Entity - The entity interacting with it.
	 * 
	 * This behaviour does not use any behaviour properties.
	 * 
	 * @param {dusk.sgui.Entity} entity The entity this behaviour will act with.
	 * @constructor
	 * @since 0.0.21-alpha
	 * @see dusk.behave.MarkTrigger
	 * @see dusk.behave.InteractableTarget
	 */
	var InteractableHost = function(entity) {
		Behave.call(this, entity);
		
		this._interactingWith = [];
		this._controlActiveActive = false;
		
		this.entityEvent.listen(_frame.bind(this), "frame");
	};
	InteractableHost.prototype = Object.create(Behave.prototype);
	
	/** Manages frame actions.
	 * @param {object} e The event object.
	 * @private
	 */
	var _frame = function(e) {
		var touchers = this._entity.allTouchersNonSolid();
		
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
	
	/** Workshop data used by `dusk.sgui.EntityWorkshop`.
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
