//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.entities");

dusk.load.provide("dusk.behave.HealthRestore");

dusk.behave.HealthRestore = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("pickupHealth", 1, true);
	
	this.entityEvent.listen(this._healthPickup, this, {"name":"pickup"});
};
dusk.behave.HealthRestore.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.HealthRestore.prototype._healthPickup = function(e) {
	e.target.behaviourFire("heal", {"amount":this._data("pickupHealth")});
};

dusk.behave.HealthRestore.workshopData = {
	"help":"Will restore health to the entity that picks it up.",
	"data":[
		["pickupHealth", "integer", "Health restored when picked up."]
	]
};

Object.seal(dusk.behave.HealthRestore);
Object.seal(dusk.behave.HealthRestore.prototype);

dusk.entities.registerBehaviour("HealthRestore", dusk.behave.HealthRestore);
