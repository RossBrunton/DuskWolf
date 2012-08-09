//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Tile");

goog.provide("dusk.sgui.PlatEntity");

/** */
dusk.sgui.PlatEntity = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Tile.call(this, parent, comName);
		
		this.dy = 0;
		this.dx = 0;
		
		this._behave = null;
		this._eProps = {};
		this.typeChange("default");
		
		this._touchers = {"l":[], "r":[], "u":[], "d":[]};
		
		this._teatherClients = [];
		this._teatherHost = null;
		
		this._ssize = dusk.events.getVar("plat.ssize");
		
		this.prop("width", 1 << dusk.events.getVar("plat.tsize"));
		this.prop("height", 1 << dusk.events.getVar("plat.tsize"));
	}
};
dusk.sgui.PlatEntity.prototype = new dusk.sgui.Tile();
dusk.sgui.PlatEntity.constructor = dusk.sgui.PlatEntity;

dusk.sgui.PlatEntity.prototype.className = "PlatEntity";

dusk.sgui.PlatEntity.prototype.moveAndCollide = function() {
	//Gravity
	if(this.dy < this.eProp("terminal") && /*!this.touchers("d").length &&*/ !this._teatherHost){
		this.dy += this.eProp("gravity");
	}
	
	//Slowdown
	if(this.dx > this.eProp("slowdown")){
		this.dx -= this.eProp("slowdown");
	}else if(this.dx < -this.eProp("slowdown")){
		this.dx += this.eProp("slowdown");
	}else{
		this.dx = 0;
	}
	
	this.performMotion(this.dx, this.dy, true);
	
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

dusk.sgui.PlatEntity.prototype.performMotion = function(cdx, cdy, main) {
	var coll = [];
	var collidedWith = [];
	var dir = cdy>0?1:-1;
	//if(!(!this._teatherHost || this._teatherHost[1].indexOf("l") !== -1 || this._teatherHost[1].indexOf("r") !== -1)) {
		for(var i = ~~Math.abs(cdy); i > 0; i --){
			console.assert(i!=0);
			if(dir == 1) {
				//Going down
				if(this.path("../../scheme").tilePointIn(this.x+4, this.y+this.prop("height")).toString() == [1, 0].toString()
				|| this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y+this.prop("height")).toString() == [1, 0].toString()) {
					cdy = 0;
					if(main) this.dy = 0;
					
					this._behave.onLand();
					break;
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x+4, this.y+this.prop("height"), this).concat(this.path("..").getEntitiesHere(this.x+this.prop("width")-4, this.y+this.prop("height"), this));
				var repeat = false;
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWith.indexOf(coll[c]) === -1) {
						cdy = 0;
						if(main) this.dy = 0;
						this._behave.onCollideBottom(coll[c]);
						coll[c].collidedTop(this);
						collidedWith.push(coll[c]);
						repeat = true;
					}
				}
				if(repeat) {
					i ++;
					continue;
				}
				if(coll.length) break;
			
			}else{
				//Going up
				if(this.path("../../scheme").tilePointIn(this.x+4, this.y-1).toString() == [1, 0].toString()
				|| this.path("../../scheme").tilePointIn(this.x+this.prop("width")-4, this.y-1).toString() == [1, 0].toString()) {
					cdy = 0;
					if(main) this.dy = 0;
					
					this._behave.onBonk();
					break;
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x+4, this.y-1, this).concat(this.path("..").getEntitiesHere(this.x+this.prop("width")-4, this.y-1, this));
				var repeat = false;
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWith.indexOf(coll[c]) === -1) {
						cdy = 0;
						if(main) this.dy = 0;
						this._behave.onCollideTop(coll[c]);
						coll[c].collidedBottom(this);
						collidedWith.push(coll[c]);
						repeat = true;
					}
				}
				if(repeat) {
					i ++;
					continue;
				}
				if(coll.length) break;
			}
			
			this.y += dir;
		}
	//}
	
	// -----
	// Horizontal motion
	// -----
	
	coll = [];
	collidedWith = [];
	var dir = cdx>0?1:-1;
	//if(!(!this._teatherHost || this._teatherHost[1].indexOf("u") !== -1 || this._teatherHost[1].indexOf("d") !== -1)) {
		for(var i = ~~Math.abs(cdx); i > 0; i --){
			if(dir == 1) {
				//Going right
				if(this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+4).toString() == [1, 0].toString()
				|| this.path("../../scheme").tilePointIn(this.x+this.prop("width"), this.y+this.prop("height")-4).toString() == [1,0].toString()) {
					cdx = 0;
					if(main) this.dx = 0;

					this._behave.onHitRight();
					break;
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x+this.prop("width"), this.y+4, this).concat(this.path("..").getEntitiesHere(this.x+this.prop("width"), this.y+this.prop("height")-4, this));
				var repeat = false;
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWith.indexOf(coll[c]) === -1) {
						cdx = 0;
						if(main) this.dx = 0;
						this._behave.onCollideRight(coll[c]);
						coll[c].collidedLeft(this);
						collidedWith.push(coll[c]);
						repeat = true;
					}
				}
				if(repeat) {
					i ++;
					continue;
				}
				if(coll.length) break;
				
			}else{
				//Going left
				if(this.path("../../scheme").tilePointIn(this.x-1, this.y+4).toString() == [1,0].toString()
				|| this.path("../../scheme").tilePointIn(this.x-1, this.y+this.prop("height")-4).toString() == [1, 0].toString()) {
					cdx = 0;
					if(main) this.dx = 0;
					
					this._behave.onHitLeft();
					break;
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x-1, this.y+4, this).concat(this.path("..").getEntitiesHere(this.x-1, this.y+this.prop("height")-4, this));
				var repeat = false;
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWith.indexOf(coll[c]) === -1) {
						cdx = 0;
						if(main) this.dx = 0;
						this._behave.onCollideLeft(coll[c]);
						coll[c].collidedRight(this);
						collidedWith.push(coll[c]);
						repeat = true;
					}
				}
				if(repeat) {
					i ++;
					continue;
				}
				if(coll.length) break;
			}
			
			this.x += dir;
		}
	//}
	
	return [cdx, cdy];
};

dusk.sgui.PlatEntity.prototype.startFrame = function(collider) {
	this._behave.everyFrame();
	this._touchers = {"l":[], "r":[], "u":[], "d":[]};
};

dusk.sgui.PlatEntity.prototype.typeChange = function(type) {
	this._type = type;
	this._eProps = dusk.events.getVar("pentity."+this._type);
	this.eProp("type", this._type)
	
	this.prop("tile", "0,0");
	this.prop("src", this.eProp("img"));
	
	this._behave = new window.pbehave[this.eProp("behaviour")](this, dusk.events);
};

dusk.sgui.PlatEntity.prototype.collideLeft = function(collider) {
	this._touchers.r[this._touchers.r.length] = collider;
	this._behave.onCollideLeft(collider);
};

dusk.sgui.PlatEntity.prototype.collideRight = function(collider) {
	this._touchers.l[this._touchers.l.length] = collider;
	this._behave.onCollideRight(collider);
};

dusk.sgui.PlatEntity.prototype.collideTop = function(collider) {
	this._touchers.d[this._touchers.d.length] = collider;
	this._behave.onCollideTop(collider);
};

dusk.sgui.PlatEntity.prototype.collideBottom = function(collider) {
	this._touchers.u[this._touchers.u.length] = collider;
	this._behave.onCollideBottom(collider);
};

dusk.sgui.PlatEntity.prototype.collidedLeft = function(collider) {
	this._touchers.r[this._touchers.r.length] = collider;
	this._behave.onCollidedLeft(collider);
};

dusk.sgui.PlatEntity.prototype.collidedRight = function(collider) {
	this._touchers.l[this._touchers.l.length] = collider;
	this._behave.onCollidedRight(collider);
};

dusk.sgui.PlatEntity.prototype.collidedTop = function(collider) {
	this._touchers.d[this._touchers.d.length] = collider;
	this._behave.onCollidedTop(collider);
};

dusk.sgui.PlatEntity.prototype.collidedBottom = function(collider) {
	this._touchers.u[this._touchers.u.length] = collider;
	this._behave.onCollidedBottom(collider);
};

dusk.sgui.PlatEntity.prototype.touchers = function(dir) {
	if(!(dir in this._touchers)) {console.warn("Unknown dir "+dir+" for touching!"); return [];}
	return this._touchers[dir];
};

dusk.sgui.PlatEntity.prototype.teather = function(target, dir) {
	this._teatherClients[this._teatherClients.length] = [target, dir];
	target.receiveTeather(this, dir);
};

dusk.sgui.PlatEntity.prototype.unteather = function(target) {
	target.receiveTeather(null, null);
	for(var i = this._teatherClients.length-1; i >= 0; i--) {
		if(this._teatherClients[i][0] == target) this._teatherClients.splice(i, 1);
	}
};

dusk.sgui.PlatEntity.prototype.receiveTeather = function(host, dir) {
	if(!host) this._teatherHost = null; else this._teatherHost = [host, dir];
	
};

dusk.sgui.PlatEntity.prototype.teatherClients = function() {
	return this._teatherClients;
};

dusk.sgui.PlatEntity.prototype.eProp = function(prop, set) {
	if(set !== undefined) {
		this._eProps[prop] = set;
		return set;
	}
	
	if(this._eProps && prop in this._eProps) {
		return this._eProps[prop];
	}
};
