//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Killable", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	
	var Killable = function(entity) {
		Behave.call(this, entity);
		
		this._data("hp", 1, true);
		this._data("maxHp", 1, true);
		this._data("mercyTime", 30, true);
		this._data("currentMercy", 0, true);
		
		this.entityEvent.listen(this._killableTakeDamage.bind(this), "takeDamage");
		this.entityEvent.listen(this._killableHeal.bind(this), "heal");
		this.entityEvent.listen(this._killableFrame.bind(this), "frame");
	};
	Killable.prototype = Object.create(Behave.prototype);

	Killable.prototype._killableTakeDamage = function(e) {
		if(isNaN(e.damage)) {
			console.warn("Tried to damage entity with NaN damage "+e.damage+".");
			return;
		}
		
		if(!this._data("currentMercy")) {
			if(this._entity.behaviourFireWithReturn("performDamage", e).indexOf(true) === -1) {
				this._data("hp", this._data("hp")-e.damage);
				this._data("currentMercy", this._data("mercyTime"));
				
				if(this._data("hp") <= 0) {
					this._entity.terminate();
				}
			}
			
			this._data("currentMercy", this._data("mercyTime"));
		}
	};

	Killable.prototype._killableHeal = function(e) {
		if(isNaN(e.amount)) {
			console.warn("Tried to heal entity with NaN "+e.amount+".");
			return;
		}
		
		if(this._data("hp") >= this._data("maxHp")) return;
		
		if(this._entity.behaviourFireWithReturn("performHeal", e).indexOf(true) === -1) {
			this._data("hp", this._data("hp")+e.amount);
			if(this._data("hp") >= this._data("maxHp")) this._data("hp", this._data("maxHp"));
		}
	};

	Killable.prototype._killableFrame = function(name, e) {
		if(this._data("currentMercy")) {
			this._data("currentMercy", this._data("currentMercy")-1);
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Killable.workshopData = {
		"help":"Will allow the entity to be killed and damaged.",
		"data":[
			["hp", "integer", "Initial HP."],
			["maxHp", "integer", "Max HP."],
			["mercyTime", "integer", "Invincibilty frames after being hit."],
			["currentMercy", "integer", "Initial invincibility frames."],
		]
	};

	Object.seal(Killable);
	Object.seal(Killable.prototype);

	entities.registerBehaviour("Killable", Killable);
	
	return Killable;
})());
