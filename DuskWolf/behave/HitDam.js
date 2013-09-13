//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.HitDam");

/** @class dusk.behave.HitDam
 * 
 * @classdesc An entity with this behaviour, on colliding into or with another entity will attempt to damage it.
 * 
 * The target must match the behaviour property trigger string `"damages"` (default empty) for it to try to be damaged.
 * The type of damage is given by the behaviour property `"types"` which is an array (default []) and the amount of
 * damage is given by the behaviour property `"damage"` (default 1).
 * 
 * Understandably, the target must have the behaviour `{@link dusk.behave.Killable}` to react to this.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.HitDam = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("types", [], true);
		this._data("damage", 1, true);
		this._data("damages", "", true);
		
		this.entityEvent.listen(this._hdCollide, this, {"name":"collide"});
		this.entityEvent.listen(this._hdCollide, this, {"name":"collidedInto"});
	}
};
dusk.behave.HitDam.prototype = Object.create(dusk.behave.Behave.prototype);

/** Used to manage collisions internally.
 * @param {object} e A "collide" or "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.HitDam.prototype._hdCollide = function(e) {
	if(e.target === "wall") return;
	if(!e.target.meetsTrigger(this._data("damages"))) return;
	e.target.behaviourFire("takeDamage", {
		"damage":this._data("damage"), "source":this._entity, "types":this._data("types")
	});
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.HitDam.workshopData = {
	"help":"Will deal damage to Killable entities.",
	"data":[
		["damage", "integer", "Amount of damage done.", "1"],
		["types", "array", "Damage types. (:: seperated)", "[]"],
		["damages", "string", "A critrea which is true for all entities this can damage.", "\"\""]
	]
};

Object.seal(dusk.behave.HitDam);
Object.seal(dusk.behave.HitDam.prototype);

dusk.entities.registerBehaviour("HitDam", dusk.behave.HitDam);
