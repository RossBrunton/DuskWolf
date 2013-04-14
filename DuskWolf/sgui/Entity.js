//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.utils");

dusk.load.provide("dusk.sgui.Entity");

/* */
dusk.sgui.Entity = function (parent, comName) {
	dusk.sgui.Tile.call(this, parent, comName);
	
	this.dy = 0;
	this.dx = 0;
	
	this._behaviours = {};
	this.behaviourData = {};
	
	this._type = "";
	this.entType = "root";
	
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
	
	this.collisionOffsetX = 0;
	this.collisionOffsetY = 0;
	this.collisionWidth = 0;
	this.collisionHeight = 0;
	
	this.collisionMark = "";
	
	this.scheme = null;
	this.schemePath = null;
	
	this._teatherClients = [];
	this._teatherHost = null;
	
	//Default sizes
	if(dusk.entities.mode == "BINARY") {
		this.mode = "BINARY";
		this.ssize = dusk.entities.ssize;
		this.width = 1 << dusk.entities.tsize;
		this.height = 1 << dusk.entities.tsize;
	}else{
		this.mode = "DECIMAL";
		this.sheight = dusk.entities.sheight;
		this.swidth = dusk.entities.swidth;
		this.width = dusk.entities.twidth;
		this.height = dusk.entities.theight;
	}
	
	//Prop masks
	this._registerPropMask("dx", "dx");
	this._registerPropMask("dy", "dy");
	this._registerPropMask("scheme", "schemePath");
	this._registerPropMask("entType", "entType");
	
	//Listeners
	if(this.collisionMark) this.prepareDraw.listen(this._collisionDraw, this);
};
dusk.sgui.Entity.prototype = new dusk.sgui.Tile();
dusk.sgui.Entity.constructor = dusk.sgui.Entity;

dusk.sgui.Entity.prototype.className = "Entity";

dusk.sgui.Entity.prototype.moveAndCollide = function() {
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
			if(this._teatherClients[i][1].indexOf("X") !== -1
			&& (this._teatherClients[i][0].x + this._teatherClients[i][0].width < this.x
			|| this._teatherClients[i][0].x > this.x + this.width)) {
				this.unteather(this._teatherClients[i][0]);
				break;
			}
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
};

dusk.sgui.Entity.prototype.performMotion = function(cdx, cdy, main) {
	var collidedWithY = [];
	var collidedWithX = [];
	var dirY = cdy>0?1:-1;
	var dirX = cdx>0?1:-1;
	
	function checkCollisionEntities(x1, y1, x2, y2) {
		if(this._container instanceof dusk.sgui.EntityGroup)
			return this._container.getCollisions(x1, y1, x2, y2, this);
		return [];
	}
	
	function doCollision(x1, y1, x2, y2, dir, isX) {
		if(this.scheme && this.scheme.tilePointIn(x1, y1).toString() == [1, 0].toString()
		|| this.scheme.tilePointIn(x2, y2).toString() == [1, 0].toString()) {
			if(isX) {
				cdx = 0;
				if(main) this.dx = 0;
			} else {
				cdy = 0;
				if(main) this.dy = 0;
			}
			
			this._touchers[dir].push("wall");
			this.behaviourFire("collide", {"dir":dir, "target":"wall"});
		}
		
		//Entities
		var pastSpeed = isX?this.dx:this.dy;
		var collidedWith = isX?collidedWithX:collidedWithY;
		var coll = checkCollisionEntities.call(this, x1, y1, x2, y2);
		for(var c = coll.length-1; c >= 0; c --) {
			if(collidedWith.indexOf(coll[c]) === -1) {
				this._touchers[dir].push(coll[c]);
				this.behaviourFire("collide", {"dir":dir, "target":coll[c]});
				coll[c].behaviourFire("collidedInto", {"dir":dir, "target":this});
				
				collidedWith.push(coll[c]);
			}
		}
		
		if(checkCollisionEntities.call(this, x1, y1, x2, y2).length){
			if(isX) {
				cdx = 0;
				if(main && this.dx == pastSpeed) this.dx = 0;
			} else {
				cdy = 0;
				if(main && this.dy == pastSpeed) this.dy = 0;
			}
		}
	}
	
	cdy = ~~Math.abs(cdy);
	cdx = ~~Math.abs(cdx);
	while(cdy > 0 || cdx > 0) {
		if(cdy > 0) {
			if(dirY == 1) {
				//Going down
				doCollision.call(this, this.x+this.collisionOffsetX, this.y+this.collisionHeight,
					this.x+this.collisionWidth-1, this.y+this.collisionHeight, "d", false
				);
			}else{
				//Going up
				doCollision.call(this, this.x+this.collisionOffsetX, this.y+this.collisionOffsetY-1,
					this.x+this.collisionWidth-1, this.y+this.collisionOffsetY-1, "u", false
				);
			}
			
			if(cdy) this.y += dirY;
			cdy --;
		}
		
		if(cdx > 0) {
			if(dirX == 1) {
				//Going right
				doCollision.call(this, this.x+this.collisionWidth, this.y+this.collisionOffsetY,
					this.x+this.collisionWidth, this.y+this.collisionHeight-1, "r", true
				);
			}else{
				//Going left
				doCollision.call(this, this.x+this.collisionOffsetX-1, this.y+this.collisionOffsetY,
					this.x+this.collisionOffsetX-1, this.y+this.collisionHeight-1, "l", true
				);
			}
			
			if(cdx) this.x += dirX;
			cdx --;
		}
	}
};

dusk.sgui.Entity.prototype.startFrame = function() {
	this.behaviourFire("frame");
	this._touchers = {"l":[], "r":[], "u":[], "d":[]};
	
	//Animation
	this._frameCountdown--;
	if(this._frameCountdown <= 0) {
		this._animationTick();
		this._frameCountdown = this._frameDelay+1;
	}
};


//schemePath
Object.defineProperty(dusk.sgui.Entity.prototype, "schemePath", {
	get: function() {
		return this.scheme?this.scheme.fullPath():undefined;
	},
	
	set: function(value) {
		if(value) this.scheme = this.path(value);
	}
});


//entType
Object.defineProperty(dusk.sgui.Entity.prototype, "entType", {
	get: function() {
		return this._type;
	},
	
	set: function(type) {
		this._type = type;
		this.behaviourData = dusk.utils.clone(dusk.entities.types.getAll(type).data);
		this.animationData = dusk.utils.clone(dusk.entities.types.getAll(type).animation);
		
		this.setAnimation("stationary");
		this.prop("src", this.behaviourData.img);
		if("dx" in this.behaviourData) this.dx = this.behaviourData.dx;
		if("dy" in this.behaviourData) this.dy = this.behaviourData.dy;
		
		if("collisionWidth" in this.behaviourData) {
			this.collisionWidth = this.behaviourData.collisionWidth;
		} else this.collisionWidth = this.width;
		
		if("collisionHeight" in this.behaviourData) {
			this.collisionHeight = this.behaviourData.collisionHeight;
		} else this.collisionHeight = this.height;
		
		if("collisionOffsetX" in this.behaviourData) {
			this.collisionOffsetX = this.behaviourData.collisionOffsetX;
		} else this.collisionOffsetX = 0;
		
		if("collisionOffsetY" in this.behaviourData) {
			this.collisionOffsetY = this.behaviourData.collisionOffsetY;
		} else this.collisionOffsetY = 0;
		
		var beh = dusk.entities.types.getAll(type).behaviours;
		for(var b in beh) {
			if(beh[b]) this.addBehaviour(b, true);
		}
		
		this.behaviourFire("typeChange");
	}
});



dusk.sgui.Entity.prototype.behaviourFire = function(event, data) {
	var output = [];
	if(!data) data = {};
	data.name = event;
	for(var b in this._behaviours) {
		output.push(this._behaviours[b].entityEvent.fire(data));
	}
	
	return output;
};

dusk.sgui.Entity.prototype.addBehaviour = function(name, reInit) {
	if(name in this._behaviours && !reInit) return null;
	this._behaviours[name] = new (dusk.entities.getBehaviour(name))(this);
};



dusk.sgui.Entity.prototype.setAnimation = function(name, data, reInit, terminates) {
	if(data === undefined) data = {};
	if(!("flags" in data)) data.flags = [];
	
	this._aniTerminate = terminates==true;
	if(name == this.aniName && !reInit && dusk.utils.arrayEqual(data.flags, this._aniFlags)) return;
	
	this._aniFlags = data.flags;
	
	if(!this.lookupFlaggedAni(name, this._aniFlags)) {
		if(terminates) this.behaviourFire("aniComplete", {"name":name});
		return;
	}
	
	this._currentAni = this.animationData[this.lookupFlaggedAni(name, this._aniFlags)].split("|");
	this._aniPointer = 0;
	this.aniName = name;
	this._animationTick();
};

dusk.sgui.Entity.prototype._animationTick = function() {
	this.tileStr = this._currentAni[this._aniPointer];
	this._aniPointer ++;
	if(this._aniPointer == this._currentAni.length) {
		this._aniPointer = 0;
		if(this._aniTerminate) this.behaviourFire("aniComplete", {"name":this.aniName});
	}
};

dusk.sgui.Entity.prototype.lookupFlaggedAni = function(name, flags) {
	for(var i = 0; i < flags.length; i ++) {
		if(name+"-"+flags[i] in this.animationData) {
			return name+"-"+flags[i];
		}
	}
	
	if(name in this.animationData) return name;
	return null;
};

dusk.sgui.Entity.prototype.aniFlagActive = function(flag) {
	return this._aniFlags.indexOf(flag) !== -1;
};



dusk.sgui.Entity.prototype.touchers = function(dir) {
	if(!(dir in this._touchers)) {console.warn("Unknown dir "+dir+" for touching!"); return [];}
	return this._touchers[dir];
};

dusk.sgui.Entity.prototype.teather = function(target, dir) {
	this._teatherClients[this._teatherClients.length] = [target, dir];
	target.receiveTeather(this, dir);
};

dusk.sgui.Entity.prototype.unteather = function(target) {
	target.receiveTeather(null, null);
	for(var i = this._teatherClients.length-1; i >= 0; i--) {
		if(this._teatherClients[i][0] == target) this._teatherClients.splice(i, 1);
	}
};

dusk.sgui.Entity.prototype.receiveTeather = function(host, dir) {
	if(!host) this._teatherHost = null; else this._teatherHost = [host, dir];
	
};

dusk.sgui.Entity.prototype.teatherClients = function() {
	return this._teatherClients;
};



dusk.sgui.Entity.prototype.eProp = function(prop, set) {
	if(set !== undefined) {
		this.behaviourData[prop] = set;
		return set;
	}
	
	if(this.behaviourData && prop in this.behaviourData) {
		return this.behaviourData[prop];
	}
};

dusk.sgui.Entity.prototype._collisionDraw = function(c) {
	c.strokeStyle = this.collisionMark;
	c.strokeRect(this.x + this.collisionOffsetX, this.y + this.collisionOffsetY,
		-this.collisionOffsetX+this.collisionWidth, -this.collisionOffsetY+this.collisionHeight
	);
};

Object.seal(dusk.sgui.Entity);
Object.seal(dusk.sgui.Entity.prototype);

dusk.sgui.registerType("Entity", dusk.sgui.Entity);
