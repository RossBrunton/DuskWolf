//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.pbehave = {};

goog.provide("dusk.pbehave.PBehave");
goog.provide("dusk.pbehave.Stayer");

/** */
window.pbehave.PBehave = function(entity, events) {
	this._entity = entity;
	this._events = events;
};

window.pbehave.PBehave.prototype.everyFrame = function() {};

window.pbehave.PBehave.prototype.onLand = function() {};
window.pbehave.PBehave.prototype.onBonk = function() {};
window.pbehave.PBehave.prototype.onHitRight = function() {};
window.pbehave.PBehave.prototype.onHitLeft = function() {};

window.pbehave.PBehave.prototype.onCollideLeft = function(collider) {};
window.pbehave.PBehave.prototype.onCollideRight = function(collider) {};
window.pbehave.PBehave.prototype.onCollideTop = function(collider) {};
window.pbehave.PBehave.prototype.onCollideBottom = function(collider) {};

//-----

window.pbehave.Stayer = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
	}
};
window.pbehave.Stayer.prototype = new window.pbehave.PBehave();
window.pbehave.Stayer.constructor = window.pbehave.Stayer;
