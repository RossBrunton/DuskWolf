//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Tile");

goog.provide("dusk.sgui.PlatEntity");

/** */
sgui.PlatEntity = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Tile.call(this, parent, events, comName);
		
		this.dy = 0;
		this.dx = 0;
		
		this._behave = null;
		this._eProps = {};
		this.typeChange("default");
		
		this._touchers = {"l":[], "r":[], "u":[], "d":[]};
		
		this._teatherClients = [];
		this._teatherHost = null;
		
		this._ssize = this._events.getVar("plat.ssize");
		
		this.prop("width", 1 << this._events.getVar("plat.tsize"));
		this.prop("height", 1 << this._events.getVar("plat.tsize"));
	}
};
sgui.PlatEntity.prototype = new sgui.Tile();
sgui.PlatEntity.constructor = sgui.PlatEntity;

sgui.PlatEntity.prototype.className = "PlatEntity";

sgui.PlatEntity.prototype.moveAndCollide = function() {
	// Vertical motion
	if(!this._teatherHost || this._teatherHost[1].indexOf("l") !== -1 || this._teatherHost[1].indexOf("r") !== -1) this.y += this.dy;
	
	if(this.dy < this.eProp("terminal") && !this.touchers("d").length && !this._teatherHost){
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
		
		this._behave.onLand();
	}
	
	//Top
	if((this.path("../../scheme").tilePointIn(this.x+4, this.y)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+4, this.y)[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y)[1] == 0)) {
		this.dy = 0;
		
		this.snapY(true);
		this._behave.onBonk();
	}
	
	// Horizontal motion
	
	if(this.dx > this.eProp("slowdown")){
		this.dx -= this.eProp("slowdown");
	}else if(this.dx < -this.eProp("slowdown")){
		this.dx += this.eProp("slowdown");
	}else{
		this.dx = 0;
	}
	
	if(!this._teatherHost || this._teatherHost[1].indexOf("u") !== -1 || this._teatherHost[1].indexOf("d") !== -1) this.x += this.dx;
	
	//Right
	if((this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+4)[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+this.prop("height")-4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+this.prop("height")-4)[1] == 0)) {
		this.dx = 0;
		
		this.snapX(false);
		
		this._behave.onHitRight();
	}
	
	//Left
	if((this.path("../../scheme").tilePointIn(this.x, this.y+4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x, this.y+4)[1] == 0)
	|| (this.path("../../scheme").tilePointIn(this.x, this.y+this.prop("height")-4)[0] == 1
	&& this.path("../../scheme").tilePointIn(this.x, this.y+this.prop("height")-4)[1] == 0)) {
		this.dx = 0;
		
		this.snapX(true);
		this._behave.onHitLeft();
	}
	
	//Tethering
	for(var i = this._teatherClients.length-1; i >= 0; i--) {
		if(this._teatherClients[i][1].indexOf("u") !== -1) {
			this._teatherClients[i][0].y = this.y - this._teatherClients[i][0].prop("height");
			if(this._teatherClients[i][1].indexOf("X") !== -1 && (this._teatherClients[i][0].x + this._teatherClients[i][0].prop("width") < this.x || this._teatherClients[i][0].x > this.x + this.prop("width"))) {this.unteather(this._teatherClients[i][0]); break;}
		}
		
		if(this._teatherClients[i][1].indexOf("d") !== -1) {
			this._teatherClients[i][0].y = this.y + this.prop("height");
		}
				
		if(this._teatherClients[i][1].indexOf("l") !== -1) {
			this._teatherClients[i][0].x = this.x - this._teatherClients[i][0].prop("width");
		}
			
		if(this._teatherClients[i][1].indexOf("r") !== -1) {
			this._teatherClients[i][0].x = this.x + this.prop("width");
		}
	}
	this.bookRedraw();
};

sgui.PlatEntity.prototype.startFrame = function(collider) {
	this._behave.everyFrame();
	this._touchers = {"l":[], "r":[], "u":[], "d":[]};
};

sgui.PlatEntity.prototype.typeChange = function(type) {
	this._type = type;
	this._eProps = this._events.getVar("pentity."+this._type);
	
	this.prop("tile", "0,0");
	this.prop("src", this.eProp("img"));
	
	this._behave = new window.pbehave[this.eProp("behaviour")](this, this._events);
};

sgui.PlatEntity.prototype.collideLeft = function(collider) {
	this._touchers.r[this._touchers.r.length] = collider;
	this._behave.onCollideLeft(collider);
};

sgui.PlatEntity.prototype.collideRight = function(collider) {
	this._touchers.l[this._touchers.l.length] = collider;
	this._behave.onCollideRight(collider);
};

sgui.PlatEntity.prototype.collideTop = function(collider) {
	this._touchers.d[this._touchers.d.length] = collider;
	this._behave.onCollideTop(collider);
};

sgui.PlatEntity.prototype.collideBottom = function(collider) {
	this._touchers.u[this._touchers.u.length] = collider;
	this._behave.onCollideBottom(collider);
};

sgui.PlatEntity.prototype.touchers = function(dir) {
	if(!(dir in this._touchers)) {console.warn("Unknown dir "+dir+" for touching!"); return [];}
	return this._touchers[dir];
};

sgui.PlatEntity.prototype.teather = function(target, dir) {
	this._teatherClients[this._teatherClients.length] = [target, dir];
	target.receiveTeather(this, dir);
};

sgui.PlatEntity.prototype.unteather = function(target) {
	target.receiveTeather(null, null);
	for(var i = this._teatherClients.length-1; i >= 0; i--) {
		if(this._teatherClients[i][0] == target) this._teatherClients.splice(i, 1);
	}
};

sgui.PlatEntity.prototype.receiveTeather = function(host, dir) {
	if(!host) this._teatherHost = null; else this._teatherHost = [host, dir];
	
};

sgui.PlatEntity.prototype.teatherClients = function() {
	return this._teatherClients;
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
