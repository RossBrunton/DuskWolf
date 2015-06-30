//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.HitDam", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");

	/** @class dusk.entities.behave.HitDam
	 * 
	 * @classdesc An entity with this behaviour, on colliding into or with another entity will attempt to damage it.
	 * 
	 * The target must make the function in the entity data `"damages"` (if it exists) return true for it to try to be
	 * damaged. The type of damage is given by the behaviour property `"types"` which is an array (default []) and the
	 * amount of damage is given by the behaviour property `"damage"` (default 1).
	 * 
	 * Understandably, the target must have the behaviour `{@link dusk.entities.behave.Killable}` to react to this.
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var HitDam = function(entity) {
		Behave.call(this, entity);
		
		this._data("types", [], true);
		this._data("damage", 1, true);
		
		this.entityEvent.listen(this._hdCollide.bind(this), "collide");
		this.entityEvent.listen(this._hdCollide.bind(this), "collidedInto");
	};
	HitDam.prototype = Object.create(Behave.prototype);

	/** Used to manage collisions internally.
	 * @param {object} e A "collide" or "collidedInto" event dispatched from `{@link dusk.entities.behave.Behave.entityEvent}`.
	 * @private
	 */
	HitDam.prototype._hdCollide = function(e) {
		if(e.target === "wall") return;
		if(this._data("damages") && !this._data("damages")(e.target, this._entity, e)) return;
		
		e.target.behaviourFire("takeDamage", {
			"damage":this._data("damage"), "source":this._entity, "types":this._data("types")
		});
	};

	/** Workshop data used by `{@link dusk.entities.sgui.EntityWorkshop}`.
	 * @static
	 */
	HitDam.workshopData = {
		"help":"Will deal damage to Killable entities.",
		"data":[
			["damage", "integer", "Amount of damage done.", "1"],
			["types", "array", "Damage types. (:: seperated)", "[]"],
			["damages", "string", "A critrea which is true for all entities this can damage.", "\"\""]
		]
	};

	Object.seal(HitDam);
	Object.seal(HitDam.prototype);

	entities.registerBehaviour("HitDam", HitDam);
	
	return HitDam;
})());
