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
	
	this.animationData = [];
	this._currentAni = 0;
	this._aniPointer = 0;
	this._aniLock = false;
	this._aniVars = {};
	this._particleData = [];
	this._particleCriteria = [];
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
	this.particles = null;
	this.particlesPath = null;
	
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
	this._registerPropMask("particles", "particlesPath");
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
	
	if(this._particleData) for(var i = this._particleCriteria.length-1; i >= 0; i --) {
		if("cooldown" in this._particleCriteria[i] && this._particleCriteria[i].cooldown) {
			this._particleCriteria[i].cooldown --;
		}
	}
	
	this.performAnimation(null, this._frameCountdown <= 0);
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

//particlesPath
Object.defineProperty(dusk.sgui.Entity.prototype, "particlesPath", {
	get: function() {
		return this.particles?this.particles.fullPath():undefined;
	},
	
	set: function(value) {
		if(value) this.particles = this.path(value);
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
		this._particleData = dusk.utils.clone(dusk.entities.types.getAll(type).particles);
		
		this._currentAni = -1;
		this._particleCriteria = [];
		this.performAnimation();
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



dusk.sgui.Entity.prototype.performAnimation = function(event, advance) {
	if(this._aniLock) {
		if(advance) this._aniForward(event);
		if(this._frameCountdown <= 0) this._frameCountdown = this._frameDelay+1;
		return false;
	}
	
	if(this._particleData) for(var i = this._particleData.length-1; i >= 0; i --) {
		if(this._evalTriggerArr(this._particleData[i][0].split("&"), event)[0]) {
			if(!this._particleCriteria[i]) this._particleCriteria[i] = {};
			if("cooldown" in this._particleCriteria[i] && this._particleCriteria[i].cooldown > 0) {
				continue;
			}
			if("falsified" in this._particleCriteria[i] && !this._particleCriteria[i].falsified) {
				continue;
			}
			
			if(this._particleData[i][2].initial === false && !("falsified" in this._particleCriteria[i])) {
				
			}else{
				var frags = this._particleData[i][1].split("|");
				for(var j = 0; j < frags.length; j ++) {
					this._performFrame(event, frags[j], true);
				}
			}
			
			if("cooldown" in this._particleData[i][2]) {
				this._particleCriteria[i].cooldown = this._particleData[i][2].cooldown;
			}
			
			if("onlyOnce" in this._particleData[i][2]) {
				this._particleCriteria[i].falsified = false;
			}
		}else{
			if(this._particleCriteria[i] && "falsified" in this._particleCriteria[i]) {
				this._particleCriteria[i].falsified = true;
			}
		}
	}
	
	for(var i = this.animationData.length-1; i >= 0; i --) {
		if(typeof this.animationData[i][1] == "string") this.animationData[i][1] = this.animationData[i][1].split("|");
		
		var out = this._evalTrigger(i, event);
		if(out[0]) {
			if(i == this._currentAni || (this._aniLock && !event)) {
				//Forward one frame
				if(advance) {
					this._aniPointer = (this._aniPointer + 1) % this.animationData[i][1].length;
					this._performFrame(event);
				}
			}else if(i != this._currentAni && !this._aniLock) {
				//Change animation
				this._setNewAni(i, event);
			}
			
			if(this._frameCountdown <= 0) this._frameCountdown = this._frameDelay+1;
			return out[1];
		}
	}
};

dusk.sgui.Entity.prototype._setNewAni = function(id, event) {
	this._currentAni = id;
	if(!this.animationData[id][2].supressSmooth && this.animationData[id][1].indexOf(this.tileStr) !== -1) {
		this._aniPointer = this.animationData[id][1].indexOf(this.tileStr);
	}else{
		this._aniPointer = 0;
	}
	this._performFrame(event);
};

dusk.sgui.Entity.prototype._evalTrigger = function(id, event) {
	if(typeof this.animationData[id][0] == "string") this.animationData[id][0] = this.animationData[id][0].split("&");
	
	return this._evalTriggerArr(this.animationData[id][0], event);
};

dusk.sgui.Entity.prototype._evalTriggerArr = function(arr, event) {
	var eventTriggered = false;
	for(var i = 0; i < arr.length; i ++) {
		var current = arr[i];
		
		if(current === "") return [true, eventTriggered];
		if(typeof current == "string" && current.substr(0, 3) == "on ") {
			if(event == current.substr(3).trim()) {
				eventTriggered = true;
			}else{
				return [false, true];
			}
		}else{
			if(typeof current == "string") {
				arr[i] = /^([^!<>=]+)\s*([<|>|=|<=|=>|!=])\s*([^!<>=]+)$/gi.exec(current);
				current = arr[i];
			}
			
			var lhs = this._evalOperand(current[1]);
			var rhs = this._evalOperand(current[3]);
			
			switch(current[2]) {
				case "=": if(lhs != rhs) return [false, eventTriggered]; break;
				case "!=": if(lhs = rhs) return [false, eventTriggered]; break;
				case ">": if(lhs <= rhs) return [false, eventTriggered]; break;
				case "<": if(lhs >= rhs) return [false, eventTriggered]; break;
				case ">=": if(lhs < rhs) return [false, eventTriggered]; break;
				case "<=": if(lhs > rhs) return [false, eventTriggered]; break;
			}
		}
	}
	
	return [true, eventTriggered];
};

dusk.sgui.Entity.prototype._evalOperand = function(operand, base) {
	if(base === undefined) base = "";
	if(!(typeof operand == "string")) return operand;
	operand = operand.trim();
	if(operand === "") return base;
	
	if(operand.charAt(0) == "*")
		return +base * +this._evalOperand(operand.substr(1), 0);
	if(operand.charAt(0) == "/")
		return +base / +this._evalOperand(operand.substr(1), 0);
	if(operand.charAt(0) == "+")
		return +base + +this._evalOperand(operand.substr(1), 0);
	if(operand.charAt(0) == "-")
		return +base - +this._evalOperand(operand.substr(1), 0);
	
	if(operand.substr(0, 3) == "#dx")
		return base + this._evalOperand(operand.substr(3), this.getDx());
	if(operand.substr(0, 3) == "#dy")
		return base + this._evalOperand(operand.substr(3), this.getDy());
	if(operand.substr(0, 3) == "#tb")
		return base + this._evalOperand(operand.substr(3), this.touchers(dusk.sgui.c.DIR_DOWN).length);
	if(operand.substr(0, 3) == "#tu")
		return base + this._evalOperand(operand.substr(3), this.touchers(dusk.sgui.c.DIR_UP).length);
	if(operand.substr(0, 3) == "#tl")
		return base + this._evalOperand(operand.substr(3), this.touchers(dusk.sgui.c.DIR_LEFT).length);
	if(operand.substr(0, 3) == "#tr")
		return base + this._evalOperand(operand.substr(3), this.touchers(dusk.sgui.c.DIR_RIGHT).length);
	if(operand.substr(0, 5) == "#path")
		return base + this._evalOperand(operand.substr(5), this.fullPath());
	
	if(operand.charAt(0) == "$") {
		var name = operand.substr(1).split(/[\+\-\/\*\#\.\$\:]/)[0];
		return this._evalOperand(operand.substr(name.length+1), this._aniVars[name]);
	}
	if(operand.charAt(0) == ".") {
		var name = operand.substr(1).split(/[\+\-\/\*\#\.\$\:]/)[0];
		return base + this._evalOperand(operand.substr(name.length+1), this.prop(name));
	}
	if(operand.charAt(0) == ":") {
		var name = operand.substr(1).split(/[\+\-\/\*\#\.\$\:]/)[0];
		return base + this._evalOperand(operand.substr(name.length+1), this.eprop(name));
	}
	
	var frags = operand.split(/[\+\-\/\*\#\.\$\:]/);
	return base + this._evalOperand(operand.substr(frags[0].length+1), frags[0]);
};

dusk.sgui.Entity.prototype._performFrame = function(event, current, noContinue) {
	if(!current) current = this.animationData[this._currentAni][1][this._aniPointer];
	
	switch(current.charAt(0)) {
		case "$":
			var frags = current.substr(1).split("=");
			this._aniVars[frags[0]] = frags[1];
			if(!noContinue) this._aniForward(event);
			break;
		
		case "+":
			if(!noContinue) this._frameCountdown = +current.substr(1);
			break;
		
		case "?":
			var frags = current.substr(1).split("?");
			if(this._evalTriggerArr(frags[0].split("&"))) {
				if(!noContinue) this._aniForward(event, frags[1]);
			}else{
				if(!noContinue) this._aniForward(event, frags[2]);
			}
			break;
		
		case ">":
			for(var i = this.animationData.length -1; i >= 0; i --) {
				if(this.animationData[i][2].name == current.substr(1)) {
					this._setNewAni(i, name);
					break;
				}
			}
			break;
		
		case "!":
			this.behaviourFire("animation", {"given":current.substr(1)});
			if(!noContinue) this._aniForward(event);
			break;
		
		case "*":
			var name = current.substr(1).split(" ")[0];
			var data = dusk.utils.jsonParse(current.substr(name.length+1));
			for(var p in data) {
				if(Array.isArray(data[p])) {
					data[p] = [this._evalOperand(data[p][0]), this._evalOperand(data[p][1])];
				}else{
					if(typeof data[p] == "string") data[p] = this._evalOperand(data[p]);
				}
			}
			
			if(this.particles) this.particles.applyEffect(name, data);
			if(!noContinue) this._aniForward(event);
			break;
		
		case "l":
			this._aniLock = false;
			if(!noContinue) this._aniForward(event);
			break;
		
		case "L":
			this._aniLock = true;
			if(!noContinue) this._aniForward(event);
			break;
		
		default:
			this.tileStr = current;
	}
};

dusk.sgui.Entity.prototype._aniForward = function(event, by) {
	if(by === undefined) by = 1;
	this._aniPointer = (this._aniPointer + by) % this.animationData[this._currentAni][1].length;
	this._performFrame(event);
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
