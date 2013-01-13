//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Tile");

dusk.load.provide("dusk.sgui.PlatEntity");

/** */
dusk.sgui.PlatEntity = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Tile.call(this, parent, comName);
		
		this.dy = 0;
		this.dx = 0;
		
		this._behaviours = {};
		this.behaviourData = {};
		
		this._type = "";
		this.type = "default";
		
		this.aniName = "";
		this.animationData = {};
		this._currentAni = [];
		this._aniPointer = 0;
		this._aniTerminate = false;
		this._aniFlags = [];
		this._aniPriority = 0;
		this._frameDelay = 5;
		this._frameCountdown = 0;
		
		this._touchers = {"l":[], "r":[], "u":[], "d":[]};
		
		this._teatherClients = [];
		this._teatherHost = null;
		
		this._registerPropMask("dx", "dx", true);
		this._registerPropMask("dy", "dy", true);
		
		if(dusk.plat.mode == "BINARY") {
			this.mode = "BINARY";
			this.ssize = dusk.plat.ssize;
			this.width = 1 << dusk.plat.tsize;
			this.height = 1 << dusk.plat.tsize;
		}else{
			this.mode = "DECIMAL";
			this.sheight = dusk.plat.sheight;
			this.swidth = dusk.plat.swidth;
			this.width = dusk.plat.twidth;
			this.height = dusk.plat.theight;
		}
	}
};
dusk.sgui.PlatEntity.prototype = new dusk.sgui.Tile();
dusk.sgui.PlatEntity.constructor = dusk.sgui.PlatEntity;

dusk.sgui.PlatEntity.prototype.className = "PlatEntity";

dusk.sgui.PlatEntity.prototype.moveAndCollide = function() {
	//Gravity
	if(this.dy < this.behaviourData.terminal  /*&& !this.touchers("d").length && !this._teatherHost*/){
		this.dy += this.behaviourData.gravity;
	}
	
	//Slowdown
	if(this.dx > this.behaviourData.slowdown){
		this.dx -= this.behaviourData.slowdown;
	}else if(this.dx < -this.behaviourData.slowdown){
		this.dx += this.behaviourData.slowdown;
	}else{
		this.dx = 0;
	}
	
	this.performMotion(this.dx, this.dy, true);
	
	//Tethering
	/*for(var i = this._teatherClients.length-1; i >= 0; i--) {
		if(this._teatherClients[i][1].indexOf("u") !== -1) {
			this._teatherClients[i][0].y = this.y - this._teatherClients[i][0].height;
			if(this._teatherClients[i][1].indexOf("X") !== -1 && (this._teatherClients[i][0].x + this._teatherClients[i][0].width < this.x || this._teatherClients[i][0].x > this.x + this.width)) {this.unteather(this._teatherClients[i][0]); break;}
		}
		
		if(this._teatherClients[i][1].indexOf("d") !== -1) {
			this._teatherClients[i][0].y = this.y + this.height;
		}
				
		if(this._teatherClients[i][1].indexOf("l") !== -1) {
			this._teatherClients[i][0].x = this.x - this._teatherClients[i][0].width;
		}
			
		if(this._teatherClients[i][1].indexOf("r") !== -1) {
			this._teatherClients[i][0].x = this.x + this.width;
		}
	}*/
	this.bookRedraw();
};

dusk.sgui.PlatEntity.prototype.performMotion = function(cdx, cdy, main) {
	var coll = [];
	var collidedWithY = [];
	var collidedWithX = [];
	var dirY = cdy>0?1:-1;
	var dirX = cdx>0?1:-1;
	
	cdy = ~~Math.abs(cdy);
	cdx = ~~Math.abs(cdx);
	while(cdy > 0 || cdx > 0) {
		if(cdy > 0) {
			if(dirY == 1) {
				//Going down
				if(this.path("../../scheme").tilePointIn(this.x+4, this.y+this.height).toString() == [1, 0].toString()
				|| this.path("../../scheme").tilePointIn(this.x+this.width-4, this.y+this.height).toString() == [1, 0].toString()) {
					cdy = 0;
					if(main) this.dy = 0;
					
					this._touchers.d.push("wall");
					this.behaviourFire("land");
					this.behaviourFire("collideBottom", "wall");
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x+4, this.y+this.height, this).concat(this.path("..").getEntitiesHere(this.x+this.width-4, this.y+this.height, this));
				var repeat = false;
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWithY.indexOf(coll[c]) === -1) {
						cdy = 0;
						if(main) this.dy = 0;
						
						this._touchers.d.push(coll[c]);
						this.behaviourFire("collideBottom", coll[c]);
						coll[c].behaviourFire("collidedTop", this);
						collidedWithY.push(coll[c]);
						repeat = true;
					}
				}
			
			}else{
				//Going up
				if(this.path("../../scheme").tilePointIn(this.x+4, this.y-1).toString() == [1, 0].toString()
				|| this.path("../../scheme").tilePointIn(this.x+this.width-4, this.y-1).toString() == [1, 0].toString()) {
					cdy = 0;
					if(main) this.dy = 0;
					
					this._touchers.u.push("wall");
					this.behaviourFire("bonk");
					this.behaviourFire("collideTop", "wall");
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x+4, this.y-1, this).concat(this.path("..").getEntitiesHere(this.x+this.width-4, this.y-1, this));
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWithY.indexOf(coll[c]) === -1) {
						cdy = 0;
						if(main) this.dy = 0;
						this._touchers.u.push(coll[c]);
						this.behaviourFire("collideTop", coll[c]);
						coll[c].behaviourFire("collidedBottom", this);
						collidedWithY.push(coll[c]);
					}
				}
			}
			
			if(cdy) this.y += dirY;
			cdy --;
		}
		
		// -----
		// Horizontal motion
		// -----
		if(cdx > 0) {
			if(dirX == 1) {
				//Going right
				if(this.path("../../scheme").tilePointIn(this.x+this.width, this.y+4).toString() == [1, 0].toString()
				|| this.path("../../scheme").tilePointIn(this.x+this.width, this.y+this.height-4).toString() == [1,0].toString()) {
					cdx = 0;
					if(main) this.dx = 0;
					
					this._touchers.r.push("wall");
					this.behaviourFire("collideRight", "wall");
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x+this.width, this.y+4, this).concat(this.path("..").getEntitiesHere(this.x+this.width, this.y+this.height-4, this));
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWithX.indexOf(coll[c]) === -1) {
						cdx = 0;
						if(main) this.dx = 0;
						this._touchers.r.push(coll[c]);
						this.behaviourFire("collideRight", coll[c]);
						coll[c].behaviourFire("collidedLeft", this);
						collidedWithX.push(coll[c]);
					}
				}
				
			}else{
				//Going left
				if(this.path("../../scheme").tilePointIn(this.x-1, this.y+4).toString() == [1,0].toString()
				|| this.path("../../scheme").tilePointIn(this.x-1, this.y+this.height-4).toString() == [1, 0].toString()) {
					cdx = 0;
					if(main) this.dx = 0;
					
					this._touchers.l.push("wall");
					this.behaviourFire("collideLeft", "wall");
				}
				
				//Entities
				coll = this.path("..").getEntitiesHere(this.x-1, this.y+4, this).concat(this.path("..").getEntitiesHere(this.x-1, this.y+this.height-4, this));
				var repeat = false;
				for(var c = coll.length-1; c >= 0; c --) {
					if(collidedWithX.indexOf(coll[c]) === -1) {
						cdx = 0;
						if(main) this.dx = 0;
						this._touchers.l.push(coll[c]);
						this.behaviourFire("collideLeft", coll[c]);
						coll[c].behaviourFire("collidedRight", this);
						collidedWithX.push(coll[c]);
					}
				}
			}
			
			if(cdx) this.x += dirX;
			cdx --;
		}
	}
};

dusk.sgui.PlatEntity.prototype.startFrame = function() {
	this.behaviourFire("frame");
	this._touchers = {"l":[], "r":[], "u":[], "d":[]};
	
	//Animation
	this._frameCountdown--;
	if(this._frameCountdown <= 0) {
		this._animationTick();
		this._frameCountdown = this._frameDelay+1;
	}
};



dusk.sgui.PlatEntity.prototype.__defineSetter__("type", function s_type(type) {
	this._type = type;
	this.behaviourData = dusk.utils.clone(dusk.plat.getEntityType(type).data);
	this.animationData = dusk.utils.clone(dusk.plat.getEntityType(type).animation);
	
	this.setAnimation("stationary");
	this.prop("src", this.behaviourData.img);
	if("dx" in this.behaviourData) this.dx = this.behaviourData.dx;
	if("dy" in this.behaviourData) this.dy = this.behaviourData.dy;
	
	var beh = dusk.plat.getEntityType(type).behaviours;
	for(var b in beh) {
		if(beh[b]) this.addBehaviour(b, true);
	}
	
	this.behaviourFire("typeChange");
});

dusk.sgui.PlatEntity.prototype.__defineGetter__("type", function g_type() {
	return this._type;
});

dusk.sgui.PlatEntity.prototype.behaviourFire = function(event, data) {
	var output = [];
	for(var b in this._behaviours) {
		output.push(this._behaviours[b].handleEvent.call(this._behaviours[b], event, data));
	}
	return output;
};

dusk.sgui.PlatEntity.prototype.addBehaviour = function(name, reInit) {
	if(name in this._behaviours && !reInit) return null;
	this._behaviours[name] = new dusk.behave[name](this);
};



dusk.sgui.PlatEntity.prototype.setAnimation = function(name, data, reInit, terminates) {
	if(data === undefined) data = {};
	this._aniTerminate = terminates==true;
	if(name == this.aniName && !reInit) return;
	
	this._aniFlags = data.flags?data.flags:[];
	
	if(!this.lookupFlaggedAni(name, this._aniFlags)) {
		if(terminates) this.behaviourFire("aniComplete", {"name":name});
		return;
	};
	
	this._currentAni = this.animationData[this.lookupFlaggedAni(name, this._aniFlags)].split("|");
	this._aniPointer = 0;
	this.aniName = name;
	this._animationTick();
};

dusk.sgui.PlatEntity.prototype._animationTick = function() {
	this.tile = this._currentAni[this._aniPointer];
	this._aniPointer ++;
	if(this._aniPointer == this._currentAni.length) {
		this._aniPointer = 0;
		if(this._aniTerminate) this.behaviourFire("aniComplete", {"name":this.aniName});
	}
};

dusk.sgui.PlatEntity.prototype.lookupFlaggedAni = function(name, flags) {
	for(var i = 0; i < flags.length; i ++) {
		if(name+"-"+flags[i] in this.animationData) {
			return name+"-"+flags[i];
		}
	}
	
	if(name in this.animationData) return name;
	return null;
};

dusk.sgui.PlatEntity.prototype.aniFlagActive = function(flag) {
	return this._aniFlags.indexOf(flag) !== -1;
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
		this.behaviourData[prop] = set;
		return set;
	}
	
	if(this.behaviourData && prop in this.behaviourData) {
		return this.behaviourData[prop];
	}
};
