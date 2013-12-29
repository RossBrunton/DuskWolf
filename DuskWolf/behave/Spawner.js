//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Spawner");

/* * @class dusk.behave.Spawner
 * @memberof dusk.behave
 * 
 * @classdesc 
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Spawner = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("spawns", {}, true);
	this._data("cooldowns", {}, true);
	
	this.entityEvent.listen(this._spFrame, this, {"name":"frame"});
};
dusk.behave.Spawner.prototype = Object.create(dusk.behave.Behave.prototype);

/** Called every frame to check for controls to spawn something.
 * @param {object} e A "frame" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Spawner.prototype._spFrame = function(e) {
	for(var c in this._data("cooldowns")) {
		if(this._data("cooldowns")[c] > 0) {
			this._data("cooldowns")[c] --;
		}
	}
	
	for(var p in this._data("spawns")) {
		if(!this._data("cooldowns")[p]) {
			if(this._controlActive("spawn_"+p+"_l")) this._spawn(p, "left");
			else if(this._controlActive("spawn_"+p+"_r")) this._spawn(p, "right");
			else if(this._controlActive("spawn_"+p+"_d")) this._spawn(p, "down");
			else if(this._controlActive("spawn_"+p+"_u")) this._spawn(p, "up");
			else if(this._controlActive("spawn_"+p+"_h")) this._spawn(p, "horizontal");
			else if(this._controlActive("spawn_"+p+"_v")) this._spawn(p, "vertical");
			else if(this._controlActive("spawn_"+p)) this._spawn(p);
		}
	}
};

dusk.behave.Spawner.prototype._spawn = function(name, dirOverride) {
	if(!("EntityGroup" in dusk.sgui && this._entity.container instanceof dusk.sgui.EntityGroup)) return;
	
	this._entity.animationWait("spawn_"+name, function() {
		var spawn = this._data("spawns")[name];
		var horFacing = spawn.horBase == "facing"?(this._data("headingLeft")?"left":"right"):spawn.horBase;
		var verFacing = spawn.verBase == "facing"?(this._data("headingUp")?"up":"down"):spawn.verBase;
		if(!horFacing) horFacing = "middle";
		if(!verFacing) verFacing = "middle";
		
		var dir = dirOverride;
		if(!dir || dir == "horizontal" || dir == "vertical") {
			dir = (verFacing == "middle" || dirOverride == "horizontal")?horFacing:verFacing;
		}
		
		var ent = {};
		ent.x = this._entity.x;
		ent.y = this._entity.y;
		
		ent.type = this._resolve(dir, spawn.type);
		var dropped = this._entity.container.dropEntity(ent);
		
		if(!("horOffset" in spawn)) spawn.horOffset = 0;
		if(!("verOffset" in spawn)) spawn.verOffset = 0;
		
		if(horFacing == "right") {
			dropped.x += this._entity.collisionWidth + spawn.horOffset - dropped.collisionOffsetX;
		}
		
		if(horFacing == "left") {
			dropped.x += this._entity.collisionOffsetX - spawn.horOffset - dropped.collisionWidth;
		}
		
		if(horFacing == "middle") {
			dropped.x += (this._entity.collisionWidth/2) + (dropped.collisionWidth/2) + (dropped.collisionOffsetX/2)
			 + spawn.horOffset;
		}
		
		
		if(verFacing == "bottom") {
			dropped.y += this._entity.collisionHeight + spawn.verOffset - dropped.collisionOffsetY;
		}
		
		if(verFacing == "top") {
			dropped.y += this._entity.collisionOffsetY - spawn.verOffset;
		}
		
		if(verFacing == "middle") {
			dropped.y += (this._entity.collisionHeight/2) - (dropped.collisionHeight/2) - (dropped.collisionOffsetY/2)
			 + spawn.verOffset;
		}
		
		if("cooldown" in spawn) this._data("cooldowns")[name] = spawn.cooldown;
		
		var horInitial = horFacing == "left";
		if(horFacing == "middle") horInitial = this._data("headingLeft");
		if("horInitial" in spawn) horInitial = spawn.horInitial == "left";
		dropped.eProp("headingLeft", horInitial);
		
		var verInitial = verFacing == "up";
		if(verFacing == "middle") verInitial = this._data("headingUp");
		if("verInitial" in spawn) verInitial = spawn.verInitial == "up";
		dropped.eProp("headingUp", verInitial);
		
		if(spawn.data) {
			var dat = this._resolve(dir, spawn.data);
			for(var p in dat) {
				dropped.eProp(p, this._resolve(dir, dat[p]));
			}
		}
		
		dropped.behaviourFire("spawned", {"spawner":this._entity, "data":spawn, "dir":dir});
	}, this);
};

dusk.behave.Spawner.prototype._resolve = function(dir, arr) {
	if(!Array.isArray(arr)) return arr;
	if(arr.length == 1) return arr[0];
	
	if(dir == "left" || (arr.length != 4 && dir == "up")) return arr[0];
	if(dir == "right" || (arr.length != 4 && dir == "down")) return arr[1];
	if(dir == "up") return arr[2];
	if(dir == "down") return arr[3];
	
	return arr[0];
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.Spawner.workshopData = {
	"help":"Will be able to spawn entities.",
	"data":[
		["spawns", "object", "All the entities this can spawn.", "{}"]
	]
};

Object.seal(dusk.behave.Spawner);
Object.seal(dusk.behave.Spawner.prototype);

dusk.entities.registerBehaviour("Spawner", dusk.behave.Spawner);
