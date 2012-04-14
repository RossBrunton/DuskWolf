//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

pai.BackForth = function(entity, events) {
	if(parent !== undefined){
		pai.Pai.call(this, entity, events);
		
		this._entity.dx = this._entity.eProp("haccel");
	}
};
pai.BackForth.prototype = new pai.Pai();
pai.BackForth.constructor = pai.BackForth;

pai.BackForth.prototype.everyFrame = function() {
	if(this._entity.dx < 0 && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(this._entity.dx > 0 && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
};

pai.BackForth.prototype.onHitLeft = function() {
	this._entity.dx = this._entity.eProp("haccel");
};

pai.BackForth.prototype.onHitRight = function() {
	this._entity.dx = -this._entity.eProp("haccel");
};

pai.BackForth.prototype.onCollideLeft = function(collider) {
	this._entity.dx = -this._entity.eProp("haccel");
};

pai.BackForth.prototype.onCollideRight = function(collider) {
	this._entity.dx = this._entity.eProp("haccel");
};
