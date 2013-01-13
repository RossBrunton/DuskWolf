//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Push");

dusk.behave.Push = function(entity, events) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity, events);
		
		if(!("speed" in this._entity.behaviourData)) this._entity.behaviourData.speed = 1;
		
		this._listenEvent("collidedTop", this._pCollidedTop);
		this._listenEvent("collidedBottom", this._pCollidedBottom);
		this._listenEvent("collidedLeft", this._pCollidedLeft);
		this._listenEvent("collidedRight", this._pCollidedRight);
	}
};
dusk.behave.Push.prototype = new dusk.behave.Behave();
dusk.behave.Push.constructor = dusk.behave.Push;

dusk.behave.Push.prototype._pCollidedTop = function(name, collider) {
	this._entity.performMotion(0, this._entity.behaviourData.speed);
};

dusk.behave.Push.prototype._pCollidedBottom = function(name, collider) {
	this._entity.performMotion(0, -this._entity.behaviourData.speed);
};

dusk.behave.Push.prototype._pCollidedLeft = function(name, collider) {
	this._entity.performMotion(this._entity.behaviourData.speed, 0);
};

dusk.behave.Push.prototype._pCollidedRight = function(name, collider) {
	this._entity.performMotion(-this._entity.behaviourData.speed, 0);
};
