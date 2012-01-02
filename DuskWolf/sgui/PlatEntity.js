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
		
		this._jumps = 0;
	}
};
sgui.PlatEntity.prototype = new sgui.Tile();
sgui.PlatEntity.constructor = sgui.PlatEntity;

sgui.PlatEntity.prototype.className = "PlatEntity";

sgui.PlatEntity.prototype._platEntityFrame = function(data) {
	// Vertical motion
	this.y += this.dy;
	
	if(this.dy < this._events.getVar("plat-terminal")){
		this.dy += this._events.getVar("plat-gravity");
	}
	
	//Bottom
	var yDown = false;
	if(this._container.getComponent("scheme").tilePointIn(this.x+4, this.y+this.getHeight()).getTile() == "1,0"
	|| this._container.getComponent("scheme").tilePointIn(this.x+this.getWidth()-4, this.y+this.getHeight()).getTile() == "1,0") {
		this.dy = 0;
		
		this.snapY(false);
		
		//Reset jumps
		this._jumps = 0;
	}
	
	//Top
	if(this._container.getComponent("scheme").tilePointIn(this.x+4, this.y).getTile() == "1,0"
	|| this._container.getComponent("scheme").tilePointIn(this.x+this.getWidth()-4, this.y).getTile() == "1,0") {
		this.dy = 0;
		
		this.snapY(true);
	}
	
	// Horizontal motion
	
	if(this.dx > this._events.getVar("plat-slowdown")){
		this.dx -= this._events.getVar("plat-slowdown");
	}else if(this.dx < -this._events.getVar("plat-slowdown")){
		this.dx += this._events.getVar("plat-slowdown");
	}else{
		this.dx = 0;
	}
	
	this.x += this.dx;
	//Right
	if(this._container.getComponent("scheme").tilePointIn(this.x+this.getWidth(), this.y+4).getTile() == "1,0"
	|| this._container.getComponent("scheme").tilePointIn(this.x+this.getWidth(), this.y+this.getHeight()-4).getTile() == "1,0") {
		this.dx = 0;
		
		this.snapX(false);
	}
	
	//Left
	if(this._container.getComponent("scheme").tilePointIn(this.x, this.y+4).getTile() == "1,0"
	|| this._container.getComponent("scheme").tilePointIn(this.x, this.y+this.getHeight()-4).getTile() == "1,0") {
		this.dx = 0;
		
		this.snapX(true);
	}
	
	this.bookRedraw();
};

//---------------

sgui.PlatHero = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.PlatEntity.call(this, parent, events, comName);
		
		this._registerFrameHandler(this._platHeroFrame);
		this._markAt = null;
	}
};
sgui.PlatHero.prototype = new sgui.PlatEntity();
sgui.PlatHero.constructor = sgui.PlatHero;

sgui.PlatHero.prototype.className = "PlatHero";

sgui.PlatHero.prototype._platHeroFrame = function(data) {
	if(this._events.getMod("Keyboard").isKeyPressed(37) && this.dx > -this._events.getVar("plat-speed")) {
		this.dx -= this._events.getVar("plat-accel");
	}else if(this._events.getMod("Keyboard").isKeyPressed(39) && this.dx < this._events.getVar("plat-speed")) {
		this.dx += this._events.getVar("plat-accel");
	}
	
	if(this._events.getMod("Keyboard").isKeyPressed(38) && this.dy > -4) {
		if((this._jumps == 0 && this._events.getVar("plat-skill-jump"))
		|| (this._jumps == 1 && this._events.getVar("plat-skill-dubjump"))) {
			this.dy = -this._events.getVar("plat-jump");
			this._jumps ++;
		}
	}
	
	if(this._container.getComponent("scheme").tilePointIn(this.x+(this.getWidth()/2), this.y+(this.getHeight()/2)).getTile().split(",")[1] == "1"
	&& this._container.getComponent("scheme").tilePointIn(this.x+(this.getWidth()/2), this.y+(this.getHeight()/2)).getTile().split(",")[0] != this._markAt) {
		this._markAt = this._container.getComponent("scheme").tilePointIn(this.x+(this.getWidth()/2), this.y+(this.getHeight()/2)).getTile().split(",")[0];
		this._events.run([
			{"a":"fire", "up":false, "mark":this._markAt, "event":"plat-mark"}
		], this._events.thread);
	}
};
