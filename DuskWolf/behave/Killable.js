//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Killable");

dusk.behave.Killable = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("hp", 1, true);
		this._data("mercyTime", 30, true);
		this._data("currentMercy", 0, true);
		
		this.entityEvent.listen(this._killableTakeDamage, this, {"name":"takeDamage"});
		this.entityEvent.listen(this._killableTerminate, this, {"name":"terminate"});
		this.entityEvent.listen(this._killableFrame, this, {"name":"frame"});
		this.entityEvent.listen(this._killableEndAnimate, this, {"name":"animation", "given":"kill"});
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
		this._data("hp", this._data("hp")-e.damage);
		this._data("currentMercy", this._data("mercyTime"));
		
		if(this._data("hp") <= 0) {
			console.log("I'm dead! :D");
			if(this._entity.behaviourFire("die", {}).indexOf(true) === -1) {
				if(!this._entity.performAnimation("die")) {
					this._entity.behaviourFire("terminate", {});
				}
			}
		}
	}
	
	this._data("currentMercy", this._data("mercyTime"));
};

dusk.behave.Killable.prototype._killableTerminate = function(name, e) {
	console.log("I'm terminated. D:");
	this._entity.deleted = true;
};

dusk.behave.Killable.prototype._killableFrame = function(name, e) {
	if(this._data("currentMercy")) {
		this._data("currentMercy", this._data("currentMercy")-1);
	}
};

dusk.behave.Killable.prototype._killableEndAnimate = function(name, e) {
	this._entity.behaviourFire("terminate", {});
};

Object.seal(dusk.behave.Killable);
Object.seal(dusk.behave.Killable.prototype);

dusk.entities.registerBehaviour("Killable", dusk.behave.Killable);
