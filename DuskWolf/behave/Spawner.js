//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Spawner", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var LightEntity = load.require("dusk.entities.LightEntity");
	var EntityGroup = load.suggest("dusk.EntityGroup", function(p) {EntityGroup = p});

	/** @class dusk.behave.Spawner
	 * @memberof dusk.behave
	 * 
	 * @classdesc This gives the entity the ability to spawn other entities.
	 * 
	 * Generally, entities are spawned when a control is "on", and there is no cooldown in effect. Each spawn has a name,
	 *  and if the control `spawn_name` is on, then that entity will be spawned. Other versions of the spawning controls
	 *  exist, to spawn an entity in a different direction, as follows (where `name` is the name of the spawn):
	 * 
	 * - `spawn_name_l`: Spawns an entity to the left of the one this is attached to.
	 * - `spawn_name_r`: Spawns an entity to the right of the one this is attached to.
	 * - `spawn_name_u`: Spawns an entity above the one this is attached to.
	 * - `spawn_name_d`: Spawns an entity below the one this is attached to.
	 * - `spawn_name_h`: Spawns an entity horizontal to the one this is attached to.
	 * - `spawn_name_v`: Spawns an entity vertical to the one this is attached to.
	 * 
	 * Spawns are described in the behaviour data `spawns`; an object. The key is the name of the spawn, whilst the value is
	 *  an object describing the nature of the spawn. The properties of the spawn object are as follows:
	 * 
	 * - `type`: A string; the only required property. It is the type of entity to create.
	 * - `horBase`: A string; either `"facing"`, `"middle"`, `"left"` or `"right"`, which determines what side the entity
	 *  will be spawned horizontally. `"left"` or `"right"` will spawn it on the left or right side of the spawner,
	 *  `"middle"` will spawn it at the middle, while `"facing"` will spawn it to the left or right based on the
	 *  `"headingLeft"` behaviour property. Default is `"middle"`.
	 * - `verBase`: A string; either `"facing"`, `"middle"`, `"bottom"` or `"top"`, which determines what side the entity
	 *  will be spawned vertically. `"bottom"` or `"top"` will spawn it on the bottom or top side of the spawner,
	 *  `"middle"` will spawn it at the middle, while `"facing"` will spawn it to the bottom or top based on the
	 *  `"headingUp"` behaviour property. Default is `"middle"`
	 * - `horOffset`: An integer; how far away from the spawner to spawn this. Will be added to the x coordinate if the
	 *  entity spawns on the right or middle, and subtracted if it spawns on the left.
	 * - `verOffset`: An integer; how far away from the spawner to spawn this. Will be added to the y coordinate if the
	 *  entity spawns on the bottom or middle, and subtracted if it spawns on the top.
	 * - `horInitial`: A string; Initial value of the spawned entity's `headingLeft` behaviour property. Must be the string
	 *  `"left"` or `"right"`. If omited, then this is determined by the spawn direction or (if that is `"middle"`), 
	 *  this entity's `headingLeft` property.
	 * - `horInitial`: A string; Initial value of the spawned entity's `headingUp` behaviour property. Must be the string 
	 *  `"up"` or `"down"`. If omited, then this is determined by the spawn direction or (if that is `"middle"`), this
	 *  entity's `headingUp` property.
	 * - `cooldown`: An integer; The amount of frames that be waited until another spawn with the same name can spawn.
	 * - `onlyIf`: A string; The entity will only spawn if `{@link dusk.sgui.Entity#evalTrigger}` is true with this trigger.
	 * - `applyDx`, `applyDy`, `multDx`, `multDy`: An array of arguments without the first one to call the respective
	 *  functions on the spawner with. Will be called before the animation starts.
	 * - `applyDxDrop`, `applyDyDrop`, `multDxDrop`, `multDyDrop`: An array of arguments without the first one to call the
	 *  respective functions on the dropped entity with. Will be called at the instant the entity is created.
	 * 
	 * 
	 * When the "side" of an entity is spawned, it means the size of the entity's collision rectangle, rather than the size
	 *  of the tile. All properties besides `horBase` and `verBase` support "direction resolving", instead of any property
	 *  in the spawn data and in the spawn data's `data` property, an array may be given (this means that, however, any 
	 *  "real" array like the `applyDx` ones MUST be nested in a one element array), and the property used will be the nth
	 *  element in the array, depending on the direction of the spawn (this will be the vertical direction, up or down,
	 *  unless the entity was spawned using one of the controls with a direction or the vertical direction is "middle"),
	 *  as follows:
	 * 
	 * - If the direction is `"left"` then n = 0.
	 * - If the direction is `"right"` then n = 1.
	 * - If the direction is `"up"` then n = 2 if it exists, else n = 0.
	 * - If the direction is `"down"` then n = 3 if it exists, else n = 1.
	 * 
	 * For example, for entity data with the `type` value equal to `["a", "b"]`, and a `horBase` of `"facing"` then if the
	 *  entity was being spawned when the spawner was facing left, it would be of type `a` otherwise it would be of type
	 *  `b`. If the entity was spawned with the control `spawn_name_d`, then the spawned element would be of type `b`.
	 * 
	 * This behaviour fires two animation events; the first is `spawn_name` where `name` is the name of the spawn data. This
	 *  is fired before the entity is spawned, and must be ended (i.e. Using the animation event `/spawn_name`) to spawn the
	 *  entity. The second is fired after the entity is spawned, and is named `spawn_after_name`.
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var Spawner = function(entity) {
		Behave.call(this, entity);
		
		this._data("spawns", {}, true);
		this._data("_spawn_cooldowns", {}, true);
		
		this.entityEvent.listen(this._spFrame, this, {"name":"frame"});
	};
	Spawner.prototype = Object.create(Behave.prototype);

	/** Called every frame to check for controls to spawn something.
	 * @param {object} e A "frame" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	Spawner.prototype._spFrame = function(e) {
		for(var c in this._data("_spawn_cooldowns")) {
			if(this._data("_spawn_cooldowns")[c] > 0) {
				this._data("_spawn_cooldowns")[c] --;
			}
		}
		
		for(var p in this._data("spawns")) {
			if(!this._data("_spawn_cooldowns")[p]) {
				if(this._controlActive("spawn_"+p+"_l")) this.spawn(p, "left");
				else if(this._controlActive("spawn_"+p+"_r")) this.spawn(p, "right");
				else if(this._controlActive("spawn_"+p+"_d")) this.spawn(p, "down");
				else if(this._controlActive("spawn_"+p+"_u")) this.spawn(p, "up");
				else if(this._controlActive("spawn_"+p+"_h")) this.spawn(p, "horizontal");
				else if(this._controlActive("spawn_"+p+"_v")) this.spawn(p, "vertical");
				else if(this._controlActive("spawn_"+p)) this.spawn(p);
			}
		}
	};

	/** Actually spawns an entity with the given name.
	 * @param {string} name The name of the entity to spawn.
	 * @param {?string} dirOverride The direction to spawn; if omitted, then this is determined by the data.
	 */
	Spawner.prototype.spawn = function(name, dirOverride) {
		if(!(EntityGroup && this._entity.container instanceof EntityGroup))
			return;
		
		//Get spawn data
		var spawn = this._data("spawns")[name];
		
		//Find out which way it should be facing
		var horFacing = spawn.horBase == "facing"?(this._data("headingLeft")?"left":"right"):spawn.horBase;
		var verFacing = spawn.verBase == "facing"?(this._data("headingUp")?"up":"down"):spawn.verBase;
		if(!horFacing) horFacing = "middle";
		if(!verFacing) verFacing = "middle";
		
		var dir = dirOverride;
		if(!dir || dir == "horizontal" || dir == "vertical") {
			dir = (verFacing == "middle" || dirOverride == "horizontal")?horFacing:verFacing;
		}
		
		//Check if we can spawn it
		if("onlyIf" in spawn) {
			if(!this._entity.meetsTrigger(spawn.onlyIf)) return;
		}
		
		//Cooldowns
		if("cooldown" in spawn) this._data("_spawn_cooldowns")[name] = spawn.cooldown;
		
		//Apply dx and dy effects to the spawner
		if("multDx" in spawn) {
			this._entity.multDx.apply(this._entity, ["spawn_"+name].concat(this._resolve(dir, spawn.multDx)));
		}
		
		if("multDy" in spawn) {
			this._entity.multDy.apply(this._entity, ["spawn_"+name].concat(this._resolve(dir, spawn.multDy)));
		}
		
		if("applyDx" in spawn) {
			this._entity.applyDx.apply(this._entity, ["spawn_"+name].concat(this._resolve(dir, spawn.applyDx)));
		}
		
		if("applyDy" in spawn) {
			this._entity.applyDy.apply(this._entity, ["spawn_"+name].concat(this._resolve(dir, spawn.applyDy)));
		}
		
		//Animate until we can spawn it
		this._entity.animationWait("spawn_"+name, (function() {
			//Generate a light entity to calculate coordinates based on collision offsets and dimensions
			var ent = {};
			ent.x = this._entity.x;
			ent.y = this._entity.y;
			
			ent.type = this._resolve(dir, spawn.type);
			var light = new LightEntity(ent.type);
			
			if(!("horOffset" in spawn)) spawn.horOffset = 0;
			if(!("verOffset" in spawn)) spawn.verOffset = 0;
			
			if(horFacing == "right") {
				ent.x += this._entity.collisionWidth + spawn.horOffset - light.collisionOffsetX;
			}
			
			if(horFacing == "left") {
				ent.x += this._entity.collisionOffsetX - spawn.horOffset - light.collisionWidth;
			}
			
			if(horFacing == "middle") {
				ent.x += (this._entity.collisionWidth/2) + (light.collisionWidth/2) + (light.collisionOffsetX/2)
				 + spawn.horOffset;
			}
			
			
			if(verFacing == "bottom") {
				ent.y += this._entity.collisionHeight + spawn.verOffset - light.collisionOffsetY;
			}
			
			if(verFacing == "top") {
				ent.y += this._entity.collisionOffsetY - spawn.verOffset - light.collisionHeight;
			}
			
			if(verFacing == "middle") {
				ent.y += (this._entity.collisionHeight/2) - (light.collisionHeight/2) - (light.collisionOffsetY/2)
				 + spawn.verOffset;
			}
			
			//Now drop a real entity at those coordinates
			var dropped = this._entity.container.dropEntity(ent);
			
			//Set facing of spawned entity
			var horInitial = horFacing == "left";
			if(horFacing == "middle") horInitial = this._data("headingLeft");
			if("horInitial" in spawn) horInitial = spawn.horInitial == "left";
			dropped.eProp("headingLeft", horInitial);
			
			var verInitial = verFacing == "top";
			if(verFacing == "middle") verInitial = this._data("headingUp");
			if("verInitial" in spawn) verInitial = spawn.verInitial == "up";
			dropped.eProp("headingUp", verInitial);
			
			//And additional properties
			if(spawn.data) {
				var dat = this._resolve(dir, spawn.data);
				for(var p in dat) {
					dropped.eProp(p, this._resolve(dir, dat[p]));
				}
			}
			
			//And apply dx or dy effects to the spawned entity
			if("multDxDrop" in spawn) {
				dropped.multDx.apply(dropped, 
					["spawned_"+this._entity.comName].concat(this._resolve(dir, spawn.multDxDrop)));
			}
			
			if("multDyDrop" in spawn) {
				dropped.multDy.apply(dropped, 
					["spawned_"+this._entity.comName].concat(this._resolve(dir, spawn.multDyDrop)));
			}
			
			if("applyDxDrop" in spawn) {
				dropped.applyDx.apply(dropped, 
					["spawned_"+this._entity.comName].concat(this._resolve(dir, spawn.applyDxDrop)));
			}
			
			if("applyDyDrop" in spawn) {
				dropped.applyDy.apply(dropped, 
					["spawned_"+this._entity.comName].concat(this._resolve(dir, spawn.applyDyDrop)));
			}
			
			//Fire the "spawned" event
			dropped.behaviourFire("spawned", {"spawner":this._entity, "data":spawn, "dir":dir});
			
			//And animate
			this._entity.performAnimation("spawn_after_"+name);
		}).bind(this));
	};

	/** Given a spawn property name and a direction, finds which of the array entries to use, by the following rules:
	 * - If `arr` is not an array, return `arr`.
	 * - If `dir` is `"left"` then return the first element of `arr`.
	 * - If `dir` is `"right"` then return the second element of `arr`.
	 * - If `dir` is `"up"` then return the third element of `arr` if it exists, else the first one.
	 * - If `dir` is `"down"` then return the fourth element of `arr` if it exists, else the second one.
	 * @param {string} dir The direction to resolve.
	 * @param {*} arr The array or whatever to resolve.
	 * @return {*} The element in the array as given by the rules above.
	 * @private
	 */
	Spawner.prototype._resolve = function(dir, arr) {
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
	Spawner.workshopData = {
		"help":"Will be able to spawn entities.",
		"data":[
			["spawns", "object", "All the entities this can spawn.", "{}"]
		]
	};

	Object.seal(Spawner);
	Object.seal(Spawner.prototype);

	entities.registerBehaviour("Spawner", Spawner);
	
	return Spawner;
})());
