//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.HealthRestore", function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");

	/** @class dusk.entities.behave.HealthRestore
	 * 
	 * @classdesc When picked up (and thus the entity must have the `{@link dusk.entities.behave.Pickup}` behaviour as well) this
	 * will restore the value of the behaviour property `"pickupHealth"` (default 1) to the entity's health (meaning it also
	 * needs `{@link dusk.entities.behave.Killable}`).
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 * @memberof dusk.entities.behave
	 * @extends dusk.entities.behave.Behave
	 */
	class HealthRestore extends Behave {
		constructor(entity) {
			super(entity);
			
			this._data("pickupHealth", 1, true);
			
			this.entityEvent.listen(this._healthPickup.bind(this), "pickup");
		}

		/** Used internally to manage the restoring of health.
		 * @param {object} e A `"pickup"` event dispatched from `{@link dusk.entities.behave.Behave.entityEvent}`.
		 */
		_healthPickup(e) {
			e.target.behaviourFire("heal", {"amount":this._data("pickupHealth")});
		}
	}
	
	/** Workshop data used by `{@link dusk.entities.sgui.EntityWorkshop}`.
	 * @static
	 */
	HealthRestore.workshopData = {
		"help":"Will restore health to the entity that picks it up.",
		"data":[
			["pickupHealth", "integer", "Health restored when picked up."]
		]
	}

	entities.registerBehaviour("HealthRestore", HealthRestore);
	
	return HealthRestore;
});
