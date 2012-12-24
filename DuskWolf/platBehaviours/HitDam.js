//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.HitDam");

dusk.pbehave.HitDam = function(entity) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity);
		
		this._data("damage", 1, true);
		
		this._listenEvent("collideLeft", this._hdCollide);
		this._listenEvent("collideRight", this._hdCollide);
		this._listenEvent("collideTop", this._hdCollide);
		this._listenEvent("collideBottom", this._hdCollide);
	}
};
dusk.pbehave.HitDam.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.HitDam.constructor = dusk.pbehave.HitDam;

dusk.pbehave.HitDam.prototype._hdCollide = function(event, target) {
	if(target === "wall") return;
	target.behaviourFire("takeDamage", {"damage":this._data("damage"), "source":this._entity});
};
