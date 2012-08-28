//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.Push");

dusk.pbehave.Push = function(entity, events) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity, events);
		
		if(!("speed" in this._entity.behaviourData)) this._entity.behaviourData.speed = 1;
		
		this.listenEvent("collidedTop", this._pCollidedTop);
		this.listenEvent("collidedBottom", this._pCollidedBottom);
		this.listenEvent("collidedLeft", this._pCollidedLeft);
		this.listenEvent("collidedRight", this._pCollidedRight);
	}
};
dusk.pbehave.Push.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.Push.constructor = dusk.pbehave.Push;

dusk.pbehave.Push.prototype._pCollidedTop = function(name, collider) {
	this._entity.performMotion(0, this._entity.behaviourData.speed);
};

dusk.pbehave.Push.prototype._pCollidedBottom = function(name, collider) {
	this._entity.performMotion(0, -this._entity.behaviourData.speed);
};

dusk.pbehave.Push.prototype._pCollidedLeft = function(name, collider) {
	this._entity.performMotion(this._entity.behaviourData.speed, 0);
};

dusk.pbehave.Push.prototype._pCollidedRight = function(name, collider) {
	this._entity.performMotion(-this._entity.behaviourData.speed, 0);
};
