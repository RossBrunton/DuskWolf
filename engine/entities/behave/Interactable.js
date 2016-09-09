//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.InteractableTarget", function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** Is interacted by from other entities, and then fires a global event handler.
	 * 
	 * If this entity is interacted with it will fire the `interact` event handler with an `interact event` with the
	 *  `interactType` value as the filter.
	 * 
	 * The `interact event` object contains the following properties:
	 * - type:string - The value of `interactType`.
	 * - name:string - The name of the entity target.
	 * - target:dusk.entities.sgui.Entity - The target entity (this).
	 * - interacter:dusk.entities.sgui.Entity - The entity interacting with this.
	 * - up:boolean - Whether the interaction was due to `entity_interact`.
	 * - room:string - The name of the room, if available.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - interactType:string - The value for the interaction type.
	 * - interactUpRequired:boolean = false - Whether the `entity_interact` control on the sender is requried for the
	 *  event to fire.
	 * 
	 * @since 0.0.21-alpha
	 * @see dusk.entities.behave.InteractableHost
	 * @memberof dusk.entities.behave
	 * @extends dusk.entities.behave.Behave
	 */
	class InteractableTarget extends Behave {
		/** Creates a new InteractableTarget behaviour.
		 * 
		 * @param {dusk.entities.sgui.Entity} entity The entity this behaviour will act with.
		 */
		constructor(entity) {
			super(entity);
			
			this._data("interactType", "", true);
			this._data("interactUpRequired", false, true);
			
			this.entityEvent.listen(this._interactedWith.bind(this), "interactedWith");
		}
		
		/** Handles interactions.
		 * @param {object} e The event object.
		 * @private
		 */
		_interactedWith(e) {
			if(!e.up || !this._data("interactUpRequired")) {
				InteractableTarget.interact.fire(
					{
						"type":this._data("interactType"), "name":this._entity.name, "interacter":e.interacter,
						"target":this._entity, "up":e.up,
						"room":this._entity.path("../../")?this._entity.path("../../").roomName:undefined
					}, this._data("interactType")
				);
			}
		}
	}
		
	/** Fired when this entity is interacted with. The properties of the event object are detailed in the documentation
	 *  for the class.
	 * @type dusk.utils.EventDispatcher
	 * @static
	 */
	InteractableTarget.interact = new EventDispatcher("dusk.entities.behave.InteractableTarget.interact");
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
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
});


load.provide("dusk.entities.behave.InteractableHost", function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var controls = load.require("dusk.input.controls");
	
	/** Can interact with other entities.
	 * 
	 * When this entity collides with another entity (even if it isn't solid), it will fire an `interactedWith` event
	 *  on it. Also, if the `entity_interact` control (default up key) is pressed and this entity has the behaviour
	 *  `dusk.entities.behave.PlayerControl`, another `interactedWith` event will be fired.
	 * 
	 * The `interactedWith` event object contains the following properties:
	 * - up:boolean - Whether the `entity_interact` key was pressed.
	 * - interacter:dusk.entities.sgui.Entity - The entity interacting with it.
	 * 
	 * This behaviour does not use any behaviour properties.
	 * 
	 * @since 0.0.21-alpha
	 * @see dusk.entities.behave.MarkTrigger
	 * @see dusk.entities.behave.InteractableTarget
	 * @memberof dusk.entities.behave
	 * @extends dusk.entities.behave.Behave
	 */
	class InteractableHost extends Behave {
		/** Creates a new InteractableHost behaviour.
		 * 
		 * @param {dusk.entities.sgui.Entity} entity The entity this behaviour will act with.
		 */
		constructor(entity) {
			super(entity);
			
			this._interactingWith = [];
			this._controlActiveActive = false;
			
			this.entityEvent.listen(this._frame.bind(this), "frame");
		}
		
		/** Manages frame actions.
		 * @param {object} e The event object.
		 * @private
		 */
		_frame(e) {
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
		}
	}
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
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
});
