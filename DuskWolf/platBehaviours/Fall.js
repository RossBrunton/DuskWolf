//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.pbehave.PBehave");

goog.provide("dusk.pbehave.Fall");

window.pbehave.Fall = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
		
		if(!this._entity.eProp("speed") && this._entity.eProp("speed") !== 0) this._entity.eProp("speed", 2);
	}
};
window.pbehave.Fall.prototype = new window.pbehave.PBehave();
window.pbehave.Fall.constructor = window.pbehave.Fall;

window.pbehave.Fall.prototype.everyFrame = function() {
	for(var i = this._entity.teatherClients().length-1; i>=0; i--) {
		if(this._entity.teatherClients()[i][0].dy < 0) this._entity.unteather(this._entity.teatherClients()[i][0]);
	}
	
	if(!this._entity.teatherClients().length) {
		this._entity.dy = 0;
	}
};

window.pbehave.Fall.prototype.onCollideBottom = function(collider) {
	this._entity.teather(collider, "uX");
	this._entity.dy = this._entity.eProp("speed");
};
