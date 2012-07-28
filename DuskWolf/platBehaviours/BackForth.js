//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.pbehave.PBehave");

goog.provide("dusk.pbehave.BackForth");

window.pbehave.BackForth = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
		
		this._entity.dx = this._entity.eProp("haccel");
	}
};
window.pbehave.BackForth.prototype = new window.pbehave.PBehave();
window.pbehave.BackForth.constructor = window.pbehave.BackForth;

window.pbehave.BackForth.prototype.everyFrame = function() {
	if(this._entity.dx < 0 && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(this._entity.dx > 0 && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
};

window.pbehave.BackForth.prototype.onHitLeft = function() {
	this._entity.dx = this._entity.eProp("haccel");
};

window.pbehave.BackForth.prototype.onHitRight = function() {
	this._entity.dx = -this._entity.eProp("haccel");
};

window.pbehave.BackForth.prototype.onCollideLeft = function(collider) {
	this._entity.dx = -this._entity.eProp("haccel");
};

window.pbehave.BackForth.prototype.onCollideRight = function(collider) {
	this._entity.dx = this._entity.eProp("haccel");
};
