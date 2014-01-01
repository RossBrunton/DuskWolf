//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.HealthRestore");

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
dusk.behave.HealthRestore = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("pickupHealth", 1, true);
	
	this.entityEvent.listen(this._healthPickup, this, {"name":"pickup"});
};
dusk.behave.HealthRestore.prototype = Object.create(dusk.behave.Behave.prototype);

/** Used internally to manage the restoring of health.
 * @param {object} e A `"pickup"` event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 */
dusk.behave.HealthRestore.prototype._healthPickup = function(e) {
	e.target.behaviourFire("heal", {"amount":this._data("pickupHealth")});
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.HealthRestore.workshopData = {
	"help":"Will restore health to the entity that picks it up.",
	"data":[
		["pickupHealth", "integer", "Health restored when picked up."]
	]
};

Object.seal(dusk.behave.HealthRestore);
Object.seal(dusk.behave.HealthRestore.prototype);

dusk.entities.registerBehaviour("HealthRestore", dusk.behave.HealthRestore);
