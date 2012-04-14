//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** */
pai.Pai = function(entity, events) {
	this._entity = entity;
	this._events = events;
};

pai.Pai.prototype.everyFrame = function() {};

pai.Pai.prototype.onLand = function() {};
pai.Pai.prototype.onBonk = function() {};
pai.Pai.prototype.onHitRight = function() {};
pai.Pai.prototype.onHitLeft = function() {};

pai.Pai.prototype.onCollideLeft = function(collider) {};
pai.Pai.prototype.onCollideRight = function(collider) {};
pai.Pai.prototype.onCollideTop = function(collider) {};
pai.Pai.prototype.onCollideBottom = function(collider) {};

//-----

pai.Stayer = function(entity, events) {
	if(parent !== undefined){
		pai.Pai.call(this, entity, events);
	}
};
pai.Stayer.prototype = new pai.Pai();
pai.Stayer.constructor = pai.Stayer;
