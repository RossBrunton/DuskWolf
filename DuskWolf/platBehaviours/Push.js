//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.pbehave.PBehave");

goog.provide("dusk.pbehave.Push");

window.pbehave.Push = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
		
		if(!this._entity.eProp("speed") && this._entity.eProp("speed") !== 0) this._entity.eProp("speed", 1);
	}
};
window.pbehave.Push.prototype = new window.pbehave.PBehave();
window.pbehave.Push.constructor = window.pbehave.Push;

window.pbehave.Push.prototype.everyFrame = function() {};

window.pbehave.Push.prototype.onCollidedTop = function(collider) {
	this._entity.performMotion(0, this._entity.eProp("speed"));
};

window.pbehave.Push.prototype.onCollidedBottom = function(collider) {
	this._entity.performMotion(0, -this._entity.eProp("speed"));
};

window.pbehave.Push.prototype.onCollidedLeft = function(collider) {
	this._entity.performMotion(this._entity.eProp("speed"), 0);
};

window.pbehave.Push.prototype.onCollidedRight = function(collider) {
	this._entity.performMotion(-this._entity.eProp("speed"), 0);
};
