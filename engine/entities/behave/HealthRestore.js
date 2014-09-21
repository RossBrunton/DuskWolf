//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.HealthRestore", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");

	/** @class dusk.behave.HealthRestore
	 * 
	 * @classdesc When picked up (and thus the entity must have the `{@link dusk.behave.Pickup}` behaviour as well) this
	 * will restore the value of the behaviour property `"pickupHealth"` (default 1) to the entity's health (meaning it also
	 * needs `{@link dusk.behave.Killable}`).
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var HealthRestore = function(entity) {
		Behave.call(this, entity);
		
		this._data("pickupHealth", 1, true);
		
		this.entityEvent.listen(this._healthPickup.bind(this), "pickup");
	};
	HealthRestore.prototype = Object.create(Behave.prototype);

	/** Used internally to manage the restoring of health.
	 * @param {object} e A `"pickup"` event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 */
	HealthRestore.prototype._healthPickup = function(e) {
		e.target.behaviourFire("heal", {"amount":this._data("pickupHealth")});
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	HealthRestore.workshopData = {
		"help":"Will restore health to the entity that picks it up.",
		"data":[
			["pickupHealth", "integer", "Health restored when picked up."]
		]
	};

	Object.seal(HealthRestore);
	Object.seal(HealthRestore.prototype);

	entities.registerBehaviour("HealthRestore", HealthRestore);
	
	return HealthRestore;
})());
