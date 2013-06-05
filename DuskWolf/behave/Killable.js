//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Killable");

dusk.behave.Killable = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("hp", 1, true);
		this._data("maxHp", 1, true);
		this._data("mercyTime", 30, true);
		this._data("currentMercy", 0, true);
		
		this.entityEvent.listen(this._killableTakeDamage, this, {"name":"takeDamage"});
		this.entityEvent.listen(this._killableHeal, this, {"name":"heal"});
		this.entityEvent.listen(this._killableFrame, this, {"name":"frame"});
	}
};
dusk.behave.Killable.prototype = new dusk.behave.Behave();
dusk.behave.Killable.constructor = dusk.behave.Killable;

dusk.behave.Killable.prototype._killableTakeDamage = function(e) {
	if(isNaN(e.damage)) {
		console.warn("Tried to damage entity with NaN damage "+e.damage+".");
		return;
	}
	
	if(!this._data("currentMercy")) {
		if(this._entity.behaviourFire("performDamage", e).indexOf(true) === -1) {
			this._data("hp", this._data("hp")-e.damage);
			this._data("currentMercy", this._data("mercyTime"));
			
			if(this._data("hp") <= 0) {
				this._entity.terminate();
			}
		}
	}
	
	this._data("currentMercy", this._data("mercyTime"));
};

dusk.behave.Killable.prototype._killableHeal = function(e) {
	if(isNaN(e.amount)) {
		console.warn("Tried to heal entity with NaN "+e.amount+".");
		return;
	}
	
	if(this._data("hp") >= this._data("maxHp")) return;
	
	if(this._entity.behaviourFire("performHeal", e).indexOf(true) === -1) {
		this._data("hp", this._data("hp")+e.amount);
		if(this._data("hp") >= this._data("maxHp")) this._data("hp", this._data("maxHp"));
	}
};

dusk.behave.Killable.prototype._killableFrame = function(name, e) {
	if(this._data("currentMercy")) {
		this._data("currentMercy", this._data("currentMercy")-1);
	}
};

Object.seal(dusk.behave.Killable);
Object.seal(dusk.behave.Killable.prototype);

dusk.entities.registerBehaviour("Killable", dusk.behave.Killable);
