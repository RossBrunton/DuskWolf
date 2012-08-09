//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.pbehave.PBehave");

goog.provide("dusk.pbehave.Fall");

window.pbehave.Fall = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
		
		if(!this._entity.eProp("speed") && this._entity.eProp("speed") !== 0) this._entity.eProp("speed", 1);
	}
};
window.pbehave.Fall.prototype = new window.pbehave.PBehave();
window.pbehave.Fall.constructor = window.pbehave.Fall;

window.pbehave.Fall.prototype.everyFrame = function() {};

window.pbehave.Fall.prototype.onCollidedTop = function(collider) {
	this._entity.performMotion(0, this._entity.eProp("speed"));
};
