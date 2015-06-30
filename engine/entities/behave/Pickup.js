//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Pickup", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	
	/* * @class dusk.entities.behave.Pickup
	 * @memberof dusk.entities.behave
	 * 
	 * @classdesc 
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var Pickup = function(entity) {
		Behave.call(this, entity);
		
		this._data("type", "coin", true);
		this._data("value", 1, true);
		this._data("roomLinked", true, true);
		this._data("pickupName", "", true);
		
		this.entityEvent.listen(this._pickCollided.bind(this), "collidedInto");
		this.entityEvent.listen(this._pickLoad.bind(this), "typeChange");
	};
	Pickup.prototype = Object.create(Behave.prototype);
	
	/** Used to manage collisions internally.
	 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.entities.behave.Behave.entityEvent}`.
	 * @private
	 */
	Pickup.prototype._pickCollided = function(e) {
		var name = this._entity.name;
		if(this._data("pickupName")) name = this._data("pickupName");
		if(this._data("pickupBy") && !this._data("pickupBy")(e.target, e._entity, e)) return;
		
		var room = "*";
		if(this._data("roomLinked") && this._entity.path("..")) room = this._entity.path("../..").roomName;
		
		if(!Pickup.collected(this._data("type"), name, room)
		&& this._entity.behaviourFireWithReturn("pickup",
		  {"type":this._data("type"), "value":this._data("value"), "target":e.target}).indexOf(true) === -1
		) {
			this._entity.animate("ent_pickup").then((function() {
				Pickup.collect(this._data("type"), this._data("value"), name, room);
				
				this._entity.terminate();
			}).bind(this));
		}
	};
	
	Pickup.prototype._pickLoad = function(e) {
		var name = this._entity.name;
		if(this._data("pickupName")) name = this._data("pickupName");
		
		var room = "*";
		if(this._data("roomLinked") && this._entity.path("../..")) room = this._entity.path("../..").roomName;
		
		if(Pickup.collected(this._data("type"), name, room)) this._entity.deleted = true;
	};
	
	var _collected = {};
	var _counts = {};
	
	Pickup.collect = function(type, value, name, room) {
		if(room === undefined) room = "*";
		if(!(type in _collected)) _collected[type] = [];
		
		if(name !== "*") 
			_collected[type][_collected[type].length] = [value, name, room];
		
		if(!(type in _counts)) _counts[type] = 0;
		_counts[type] += value;
	};
	
	Pickup.count = function(type, room) {
		if(!(type in _counts)) return 0;
		return _counts[type];
	};
	
	Pickup.collected = function(type, name, room) {
		if(!(type in _collected)) return false;
		if(name === "*") return false;
		for(var i = _collected[type].length-1; i >= 0; i --) {
			if(_collected[type][i][2] === room || room == "*" || !room) {
				if(_collected[type][i][1] == name) return true;
			}
		}
		
		return false;
	};
	
	Pickup.save = function(type, args, ref) {
		var out = {};
		if("only" in args) {
			for(var i = 0; i < args.only.length; i ++) {
				if(args.only[i] in _collected) {
					out[args.only[i]] = [ref(_collected[args.only[i]]), ref(_counts[args.only[i]])];
				}else{
					out[args.only[i]] = [ref([]), ref(0)];
				}
			}
		}else if("except" in args) {
			for(var p in _collected) {
				if(args.except.indexOf(p) === -1) {
					out[p] = [ref(_collected[p]), ref(_counts[p])];
				}
			}
		}else{
			for(var p in _collected) {
				out[p] = [ref(_collected[p]), ref(_counts[p])];
			}
		}
		return out;
	};
	
	Pickup.load = function(data, type, args, unref) {
		for(var p in data) {
			_collected[p] = unref(data[p][0]);
			_counts[p] = unref(data[p][1]);
		}
	};
	
	/** Workshop data used by `{@link dusk.entities.sgui.EntityWorkshop}`.
	 * @static
	 */
	Pickup.workshopData = {
		"help":"Will be pickupable and collectable.",
		"data":[
			["type", "string", "The collectable type."],
			["value", "integer", "How much it rises how much you have by."],
			["roomLinked", "boolean", "Should be true unless you give each one a unique name."],
			["pickupBy", "string", "Trigger criteria for entities that can pick this up."],
			["pickupName", "string", "If not empty, this will be considered the name of the pickup, rather than its name"
			]
		]
	};
	
	entities.registerBehaviour("Pickup", Pickup);
	
	return Pickup;
})());
