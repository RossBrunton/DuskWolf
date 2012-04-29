//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Tile");

/** */
sgui.PlatEntity = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Tile.call(this, parent, events, comName);
		
		this._registerFrameHandler(this._platEntityFrame);
		
		this.dy = 0;
		this.dx = 0;
		
		this._pai = null;
		this._eProps = {};
		this.typeChange("default");
		
		this._ssize = this._events.getVar("plat.ssize");
		
		this.prop("width", 1 << this._events.getVar("plat.tsize"));
		this.prop("height", 1 << this._events.getVar("plat.tsize"));
	}
};
sgui.PlatEntity.prototype = new sgui.Tile();
sgui.PlatEntity.constructor = sgui.PlatEntity;

sgui.PlatEntity.prototype.className = "PlatEntity";

sgui.PlatEntity.prototype._platEntityFrame = function(e) {
	//Ai
	this._pai.everyFrame();
	
	// Vertical motion
	this.y += this.dy;
	
	if(this.dy < this.eProp("terminal")){
		this.dy += this.eProp("gravity");
	}
	
	//Bottom
	var yDown = false;
	if((this.path("../../scheme").tilePointIn(this.x+4, this.y+this.prop("height"))[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+4, this.y+this.prop("height"))[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y+this.prop("height"))[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y+this.prop("height"))[1] == 0)) {
		this.dy = 0;
		
		this.snapY(false);
		
		this._pai.onLand();
	}
	
	//Top
	if((this.path("../../scheme").tilePointIn(this.x+4, this.y)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+4, this.y)[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y)[1] == 0)) {
		this.dy = 0;
		
		this.snapY(true);
		this._pai.onBonk();
	}
	
	// Horizontal motion
	
	if(this.dx > this.eProp("slowdown")){
		this.dx -= this.eProp("slowdown");
	}else if(this.dx < -this.eProp("slowdown")){
		this.dx += this.eProp("slowdown");
	}else{
		this.dx = 0;
	}
	
	this.x += this.dx;
	//Right
	if((this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+4)[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+this.prop("height")-4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+this.prop("height")-4)[1] == 0)) {
		this.dx = 0;
		
		this.snapX(false);
		
		this._pai.onHitRight();
	}
	
	//Left
	if((this.path("../../scheme").tilePointIn(this.x, this.y+4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x, this.y+4)[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x, this.y+this.prop("height")-4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x, this.y+this.prop("height")-4)[1] == 0)) {
		this.dx = 0;
		
		this.snapX(true);
		this._pai.onHitLeft();
	}
	
	this.bookRedraw();
};

sgui.PlatEntity.prototype.typeChange = function(type) {
	this._type = type;
	this._eProps = this._events.getVar("pentity."+this._type);
	
	this.prop("tile", "0,0");
	this.prop("src", this.eProp("img"));
	
	loadPai(this.eProp("pai"));
	this._pai = new pai[this.eProp("pai")](this, this._events);
};

sgui.PlatEntity.prototype.collideLeft = function(collider) {
	this._pai.onCollideLeft(collider);
};

sgui.PlatEntity.prototype.collideRight = function(collider) {
	this._pai.onCollideRight(collider);
};

sgui.PlatEntity.prototype.collideTop = function(collider) {
	this._pai.onCollideTop(collider);
};

sgui.PlatEntity.prototype.collideBottom = function(collider) {
	this._pai.onCollideBottom(collider);
};

sgui.PlatEntity.prototype.eProp = function(prop, set) {
	if(set !== undefined) {
		this._eProps[prop] = set;
		return set;
	}
	
	if(this._eProps && prop in this._eProps) {
		return this._eProps[prop];
	}
};


