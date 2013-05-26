//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.utils");

dusk.load.provide("dusk.sgui.Entity");

/* */
dusk.sgui.Entity = function (parent, comName) {
	dusk.sgui.Tile.call(this, parent, comName);
	
	this._dy = {};
	this._dx = {};
	
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
	
	this._touchers = {};
	this._touchers[dusk.sgui.c.DIR_UP] = [];
	this._touchers[dusk.sgui.c.DIR_DOWN] = [];
	this._touchers[dusk.sgui.c.DIR_LEFT] = [];
	this._touchers[dusk.sgui.c.DIR_RIGHT] = [];
	
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
dusk.sgui.Entity.prototype = Object.create(dusk.sgui.Tile.prototype);

dusk.sgui.Entity.prototype.className = "Entity";

dusk.sgui.Entity.prototype.getDx = function() {
	var dx = 0;
	for(var p in this._dx) {
		dx += this._dx[p][0];
	}
	return dx;
};

dusk.sgui.Entity.prototype.getDy = function() {
	var dy = 0;
	for(var p in this._dy) {
		dy += this._dy[p][0];
	}
	return dy;
};

dusk.sgui.Entity.prototype.applyDx = function(name, value, duration, accel, limit, noReplace) {
	if(duration == undefined) duration = -1;
	if(!accel) accel = 0;
	if(noReplace && name in this._dx) value = this._dx[name][0];
	this._dx[name] = [value, duration, accel, limit];
};

dusk.sgui.Entity.prototype.applyDy = function(name, value, duration, accel, limit, noReplace) {
	if(duration == undefined) duration = -1;
	if(!accel) accel = 0;
	if(noReplace && name in this._dy) value = this._dy[name][0];
	this._dy[name] = [value, duration, accel, limit];
};

dusk.sgui.Entity.prototype.startFrame = function() {
	this.behaviourFire("frame");
	
	//Gravity
	//this.applyDy("gravity", this.behaviourData.gravity);
	if(this.touchers(dusk.sgui.c.DIR_DOWN).length) {
		this.applyDy("gravity", 1, 1, 1, this.behaviourData.gravity);
	}else{
		this.applyDy("gravity", 1, 1, 1, this.behaviourData.gravity, true);
	}
	
	//Animation
	this._frameCountdown--;
	if(this._frameCountdown <= 0) {
		this._animationTick();
		this._frameCountdown = this._frameDelay+1;
	}
};

dusk.sgui.Entity.prototype.beforeMove = function() {
	//Clear touchers
	this._touchers[dusk.sgui.c.DIR_UP] = [];
	this._touchers[dusk.sgui.c.DIR_DOWN] = [];
	this._touchers[dusk.sgui.c.DIR_LEFT] = [];
	this._touchers[dusk.sgui.c.DIR_RIGHT] = [];
	
	for(var p in this._dx) {
		if(this._dx[p][1] == 0) {
			delete this._dx[p];
		}else{
			if(this._dx[p][1] > 0) this._dx[p][1] --;
			this._dx[p][0] += this._dx[p][2];
			if(this._dx[p][3] != undefined && this._dx[p][2] < 0 && this._dx[p][0] < this._dx[p][3])
				this._dx[p][0] = this._dx[p][3];
			if(this._dx[p][3] != undefined && this._dx[p][2] > 0 && this._dx[p][0] > this._dx[p][3])
				this._dx[p][0] = this._dx[p][3];
		}
	}
	
	for(var p in this._dy) {
		if(this._dy[p][1] == 0) {
			delete this._dy[p];
		}else{
			if(this._dy[p][1] > 0) this._dy[p][1] --;
			this._dy[p][0] += this._dy[p][2];
			if(this._dy[p][3] != undefined && this._dy[p][2] < 0 && this._dy[p][0] < this._dy[p][3])
				this._dy[p][0] = this._dy[p][3];
			if(this._dy[p][3] != undefined && this._dy[p][2] > 0 && this._dy[p][0] > this._dy[p][3])
				this._dy[p][0] = this._dy[p][3];
		}
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

dusk.sgui.Entity.prototype.addToucher = function(dir, entity) {
	this._touchers[dir][this._touchers[dir].length] = entity;
};


/*dusk.sgui.Entity.prototype.teather = function(target, dir) {
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
};*/



dusk.sgui.Entity.prototype.eProp = function(prop, set) {
	if(set !== undefined) {
		this.behaviourData[prop] = set;
		return set;
	}
	
	if(this.behaviourData && prop in this.behaviourData) {
		return this.behaviourData[prop];
	}
};

dusk.sgui.Entity.prototype._collisionDraw = function(e) {
	e.c.strokeStyle = this.collisionMark;
	e.c.lineWidth = 1;
	e.c.strokeRect(
		e.d.destX + this.collisionOffsetX, e.d.destY + this.collisionOffsetY, 
		this.collisionWidth - this.collisionOffsetX, this.collisionHeight - this.collisionOffsetY
	);
};

Object.seal(dusk.sgui.Entity);
Object.seal(dusk.sgui.Entity.prototype);

dusk.sgui.registerType("Entity", dusk.sgui.Entity);
