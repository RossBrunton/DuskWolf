//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.HitDam");

dusk.behave.HitDam = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("damage", 1, true);
		
		this._listenEvent("collidedLeft", this._hdCollide);
		this._listenEvent("collidedRight", this._hdCollide);
		this._listenEvent("collidedTop", this._hdCollide);
		this._listenEvent("collidedBottom", this._hdCollide);
		this._listenEvent("collideLeft", this._hdCollide);
		this._listenEvent("collideRight", this._hdCollide);
		this._listenEvent("collideTop", this._hdCollide);
		this._listenEvent("collideBottom", this._hdCollide);
	}
};
dusk.behave.HitDam.prototype = new dusk.behave.Behave();
dusk.behave.HitDam.constructor = dusk.behave.HitDam;

dusk.behave.HitDam.prototype._hdCollide = function(event, target) {
	if(target === "wall") return;
	target.behaviourFire("takeDamage", {"damage":this._data("damage"), "source":this._entity});
};
