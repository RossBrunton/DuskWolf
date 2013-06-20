//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.HitDam");

dusk.behave.HitDam = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("types", [], true);
		this._data("damage", 1, true);
		
		this.entityEvent.listen(this._hdCollide, this, {"name":"collide"});
		this.entityEvent.listen(this._hdCollide, this, {"name":"collidedInto"});
	}
};
dusk.behave.HitDam.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.HitDam.prototype._hdCollide = function(e) {
	if(e.target === "wall") return;
	e.target.behaviourFire("takeDamage", {
		"damage":this._data("damage"), "source":this._entity, "types":this._data("types")
	});
};

dusk.behave.HitDam.workshopData = {
	"help":"Will deal damage to Killable entities.",
	"data":[
		["damage", "integer", "Amount of damage done."],
		["types", "array", "Damage types. (:: seperated)"],
	]
};

Object.seal(dusk.behave.HitDam);
Object.seal(dusk.behave.HitDam.prototype);

dusk.entities.registerBehaviour("HitDam", dusk.behave.HitDam);
