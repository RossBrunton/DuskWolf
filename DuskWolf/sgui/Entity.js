//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.utils");
dusk.load.require("dusk.parseTree");

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
	this._aniWaits = {};
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
	
	this.terminated = false;
	
	this._teatherClients = [];
	this._teatherHost = null;
	
	this.iltr = 0;
	this.irtl = 0;
	this.ittb = 0;
	this.ibtt = 0;
	
	this._eventTriggeredMark = false;
	this._currentEvent = "";
	this._triggerTree = new dusk.parseTree.Compiler([
		["*", function(o, l, r) {return +l.eval() * +r.eval();}],
		["/", function(o, l, r) {return +l.eval() / +r.eval();}],
		["+", function(o, l, r) {return +l.eval() + +r.eval();}],
		["-", function(o, l, r) {return +l.eval() - +r.eval();}],
		["^", function(o, l, r) {return "" + l.eval() +r.eval();}],
		
		["=", function(o, l, r) {return l.eval() == r.eval() || l.eval() && r.eval() == "true"}],
		["!=", function(o, l, r) {return l.eval() != r.eval()}],
		[">", function(o, l, r) {return l.eval() > r.eval()}],
		["<", function(o, l, r) {return l.eval() < r.eval()}],
		[">=", function(o, l, r) {return l.eval() >= r.eval()}],
		["<=", function(o, l, r) {return l.eval() <= r.eval()}],
		
		["&", function(o, l, r) {return l.eval() && r.eval()}],
		["|", function(o, l, r) {return l.eval() || r.eval()}],
	], [
		["on", (function(o, v) {
				if(this._currentEvent == v.eval()) {
					this._eventTriggeredMark = true;
					return true;
				}
				return false;
			}).bind(this)
		],
		["#", (function(o, v) {
				switch(v.eval()) {
					case "dx": return this.getDx();
					case "dy": return this.getDy();
					case "tb": return this.touchers(dusk.sgui.c.DIR_DOWN).length;
					case "tu": return this.touchers(dusk.sgui.c.DIR_UP).length;
					case "tl": return this.touchers(dusk.sgui.c.DIR_LEFT).length;
					case "tr": return this.touchers(dusk.sgui.c.DIR_RIGHT).length;
					case "path": return this.fullPath();
					default: return "ERROR!";
				}
			}).bind(this)
		],
		["$", (function(o, v) {return this._aniVars[v.eval()];}).bind(this)],
		[".", (function(o, v) {return this.prop(v.eval());}).bind(this)],
		[":", (function(o, v) {return this.eProp(v.eval());}).bind(this)],
	]);
	
	//Default sizes
	this.sheight = dusk.entities.sheight;
	this.swidth = dusk.entities.swidth;
	this.width = dusk.entities.twidth;
	this.height = dusk.entities.theight;
	
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
	
	if(this.getDx() < 0) this.eProp("lastMoveLeft", true);
	if(this.getDx() > 0) this.eProp("lastMoveLeft", false);
};

dusk.sgui.Entity.prototype.applyDy = function(name, value, duration, accel, limit, noReplace) {
	if(duration == undefined) duration = -1;
	if(!accel) accel = 0;
	if(noReplace && name in this._dy) value = this._dy[name][0];
	this._dy[name] = [value, duration, accel, limit];
	
	if(this.getDy() < 0) this.eProp("lastMoveUp", true);
	if(this.getDy() > 0) this.eProp("lastMoveUp", false);
};

dusk.sgui.Entity.prototype.startFrame = function() {
	this.behaviourFire("frame");
	
	//Animation
	this._frameCountdown--;
	
	if(this._particleData) for(var i = this._particleCriteria.length-1; i >= 0; i --) {
		if(this._particleCriteria[i] && "cooldown" in this._particleCriteria[i] && this._particleCriteria[i].cooldown) {
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
	
	this.behaviourFire("beforeMove");
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
		this._aniWaits = {};
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
	var keys = Object.keys(this._behaviours);
	for(var b = keys.length-1; b >= 0; b --) {
		output.push(this._behaviours[keys[b]].entityEvent.fire(data));
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
		if(this.meetsTrigger(this._particleData[i][0], event)) {
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
		if(typeof this.animationData[i][1] == "string")
			this.animationData[i][1] = this.animationData[i][1].split("|");
		
		var out = this.meetsTrigger(this.animationData[i][0], event);
		if(out) {
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
			return this._eventTriggeredMark;
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

dusk.sgui.Entity.prototype.meetsTrigger = function(trigger, event) {
	if(trigger == "") return true;
	this._eventTriggeredMark = false;
	this._currentEvent = event;
	var e = this._triggerTree.compile(trigger).eval();
	
	return e;
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
			if(this.meetsTrigger(frags[0])) {
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
			if(this.terminated && current.substr(1) == "terminate") this.deleted = true;
			if(!noContinue) this._aniForward(event);
			break;
		
		case "/":
			if(current.substr(1) in this._aniWaits) {
				this._aniWaits[current.substr(1)][0].call(this._aniWaits[current.substr(1)][1]);
			}
			if(!noContinue) this._aniForward(event);
			break;
		
		case "*":
			var name = current.substr(1).split(" ")[0];
			var data = dusk.utils.jsonParse(current.substr(name.length+1));
			for(var p in data) {
				if(Array.isArray(data[p])) {
					data[p] = [this.meetsTrigger(data[p][0]), this.meetsTrigger(data[p][1])];
				}else{
					if(typeof data[p] == "string") data[p] = this.meetsTrigger(data[p]);
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
		
		case "t":
			this.terminate();
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
	if(prop == "img" && set) {
		this.src = set;
	}
	if(prop == "collisionWidth" && set !== undefined) {
		this.collisionWidth = set;
	}
	if(prop == "collisionHeight" && set !== undefined) {
		this.collisionHeight = set;
	}
	if(prop == "collisionOffsetX" && set !== undefined) {
		this.collisionOffsetX = set;
	}
	if(prop == "collisionOffsetY" && set !== undefined) {
		this.collisionOffsetY = set;
	}
	
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

dusk.sgui.Entity.prototype.terminate = function() {
	this.terminated = true;
	if(this.behaviourFire("terminate", {}).indexOf(true) === -1) {
		this.animationWait("terminate", function() {this.deleted = true;}, this);
	}
};

dusk.sgui.Entity.prototype.animationWait = function(name, funct, scope) {
	if(!this.performAnimation("beh_"+name)) {
		funct.call(scope);
	}else{
		this._aniWaits[name] = [funct, scope];
	}
};

Object.seal(dusk.sgui.Entity);
Object.seal(dusk.sgui.Entity.prototype);

dusk.sgui.registerType("Entity", dusk.sgui.Entity);
