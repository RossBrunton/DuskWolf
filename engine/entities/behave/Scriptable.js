//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Scriptable", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var UserCancelError = load.require("dusk.utils.reversiblePromiseChain.UserCancelError");
	var utils = load.require("dusk.utils");
	var Entity = load.require("dusk.entities.sgui.Entity");

	var Scriptable = function(entity) {
		Behave.call(this, entity);
		
		this._data("autoActive", true, true);
		
		this.entityEvent.listen(_load.bind(this), "typeChange");
		this.entityEvent.listen(_delete.bind(this), "delete");
	};
	Scriptable.prototype = Object.create(Behave.prototype);
	
	Scriptable.prototype.doRequest = function(type, args, passedArg, queue) {
		if(this._data("autoActive") && !this._entity.active) this._entity.becomeActive();
		
		switch(type) {
			case "disablePlayerControl":
				passedArg.oldControl = this._data("playerControl");
				this._data("playerControl", false);
				return Promise.resolve(passedArg);
			
			case "enablePlayerControl":
				passedArg.oldControl = this._data("playerControl");
				this._data("playerControl", true);
				return Promise.resolve(passedArg);
			
			case "disablePlayerControl^-1":
			case "enablePlayerControl^-1":
				this._data("playerControl", passedArg.oldControl);
				return Promise.reject(new UserCancelError());
			
			
			case "gridWalk":
				return new Promise((function(fulfill, reject) {
					var moves = utils.cloneArray(args.moves?args.moves:passedArg.moves);
					
					var listener = this.entityEvent.listen((function() {
						if(!this._data("gwmoves").length) {
							this.entityEvent.unlisten(listener);
							fulfill(passedArg);
						}
					}).bind(this), "gwStopMove");
					
					passedArg.initialX = this._entity.x;
					passedArg.initialY = this._entity.y;
					//passedArg.initialFacing = this._data("gwfacing");
					
					this._data("gwmoves", moves.reverse());
				}).bind(this));
			
			case "gridWalk^-1":
				this._entity.x = passedArg.initialX;
				this._entity.y = passedArg.initialY;
				//this._data("gwfacing", passedArg.initialFacing);
				
				return Promise.reject(new UserCancelError());
			
			
			case "exec":
				args.forward(this._entity, passedArg, args);
				
				return passedArg;
			
			case "exec^-1":
				args.inverse(this._entity, passedArg, args);
				
				return Promise.reject(new UserCancelError());
			
			
			case "setProp":
				passedArg.propOldValue = this._data(args.prop);
				this._data(args.prop, args.value);
				return passedArg;
			
			case "setProp^-1":
				this._data(args.prop, passedArg.propOldValue);
				return Promise.reject(new UserCancelError());
			
			
			case "animate":
				return new Promise((function(f, r) {
					this._entity.animationWait(args.animation, f.bind(undefined, passedArg));
				}).bind(this));
			
			case "animate^-1":
				return Promise.reject(new UserCancelError());
			
			
			case "rawInput":
				return new Promise((function(fulfill, reject) {
					passedArg.initialX = this._entity.x;
					passedArg.initialY = this._entity.y;
					var inputs = args.inputs?args.inputs:passedArg.inputs;
					
					var active = 0;
					var timer = inputs[0][0];
					
					var clistener = this.entityEvent.listen((function(e) {
						if(inputs[active].slice(1).indexOf(e.control) !== -1) return true;
					}).bind(this), "controlActive");
					
					var flistener = this.entityEvent.listen((function(e) {
						timer --;
						
						if(timer < 0) {
							active ++;
							if(active >= inputs.length) {
								this.entityEvent.unlisten(flistener);
								this.entityEvent.unlisten(clistener);
								return fulfill(passedArg);
							}
							
							timer = inputs[active][0];
						}
					}).bind(this), "frame");
				}).bind(this));
				
			case "rawInput^-1":
				if("inversePos" in args && args.inversePos) {
					this._entity.x = passedArg.initialX;
					this._entity.y = passedArg.initialY;
				}else{
					console.warn("Tried to do inverse of raw input; this can't be done!");
					console.log("You can use inversePos to set invert the position, though.");
				}
				
				return Promise.reject(new UserCancelError());
			
			
			case "terminate":
				return this._entity.terminate().then(function() {return passedArg});
			
			case "terminate^-1":
				console.warn("It's too late to go changing your mind now; this entity is already dead!");
				
				return Promise.reject(new UserCancelError());
		}
	};
	
	var _entities = {};
	
	var _load = function(e) {
		_entities[this._entity.name] = this._entity;
	};
	
	var _delete = function(e) {
		delete _entities[this._entity.name];
	}
	
	Scriptable.request = function(entity, type, args, passedArg, queue) {
		if(!passedArg) passedArg = {};
		if(entity == "*") entity = passedArg.entities?passedArg.entities:passedArg.entity;
		var ent = entity;
		
		if(Array.isArray(ent)) {
			return Promise.all(ent.map(function(ent) {
				return Scriptable.request(ent, type, args, passedArg, queue)
			})).then(function(v) {return v[0];});
		}
		
		if(!(ent instanceof Entity)) ent = _entities[entity];
		
		if(!ent) {
			console.error("Entity "+entity+" not found, but required for scripting. Skipping.");
			return passedArg;
		}
		
		return ent.getBehaviour("Scriptable").doRequest(type, args, passedArg, queue);
	};
	
	Scriptable.requestBound = function(entity, type, args) {
		return this.request.bind(this, entity, type, args);
	};

	Scriptable.requestBoundPair = function(entity, type, args) {
		return [
			this.request.bind(this, entity, type, args), this.request.bind(this, entity, type+"^-1", args),
			type + " for "+entity
		];
	};
	
	/** Workshop data used by `{@link dusk.entities.sgui.EntityWorkshop}`.
	 * @static
	 */
	Scriptable.workshopData = {
		"help":"Allows scripting control of this entity.",
		"data":[
			["autoActive", "boolean", "Whether a scripting action will cause the entity to become active.", "true"]
		]
	};
	
	entities.registerBehaviour("Scriptable", Scriptable);
	
	return Scriptable;
})());
