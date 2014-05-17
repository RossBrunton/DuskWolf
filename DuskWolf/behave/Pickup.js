//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Pickup", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");

	/* * @class dusk.behave.Pickup
	 * @memberof dusk.behave
	 * 
	 * @classdesc 
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var Pickup = function(entity) {
		Behave.call(this, entity);
		
		this._data("type", "coin", true);
		this._data("value", 1, true);
		this._data("roomLinked", true, true);
		this._data("pickupBy", "", true);
		this._data("pickupName", "", true);
		
		this.entityEvent.listen(this._pickCollided, this, {"name":"collidedInto"});
		this.entityEvent.listen(this._pickLoad, this, {"name":"typeChange"});
	};
	Pickup.prototype = Object.create(Behave.prototype);

	/** Used to manage collisions internally.
	 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	Pickup.prototype._pickCollided = function(e) {
		var name = this._entity.comName;
		if(this._data("pickupName")) name = this._data("pickupName");
		if(!e.target.meetsTrigger(this._data("pickupBy"))) return;
		
		var room = "*";
		if(this._data("roomLinked") && this._entity.path("..")) room = this._entity.path("../..").roomName;
		
		if(!Pickup.collected(this._data("type"), name, room)
		&& this._entity.behaviourFireWithReturn("pickup",
		  {"type":this._data("type"), "value":this._data("value"), "target":e.target}).indexOf(true) === -1
		) {
			this._entity.animationWait("pickup", (function() {
				Pickup.collect(this._data("type"), this._data("value"), name, room);
				
				this._entity.terminate();
			}).bind(this));
		}
	};

	Pickup.prototype._pickLoad = function(e) {
		var name = this._entity.comName;
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
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Pickup.workshopData = {
		"help":"Will be pickupable and collectable.",
		"data":[
			["type", "string", "The collectable type."],
			["value", "integer", "How much it rises how much you have by."],
			["roomLinked", "boolean", "Should be true unless you give each one a unique name."],
			["pickupBy", "string", "Trigger criteria for entities that can pick this up."],
			["pickupName", "string", "If not empty, this will be considered the name of the pickup, rather than its comName"
			]
		]
	};

	Object.seal(Pickup);
	Object.seal(Pickup.prototype);

	entities.registerBehaviour("Pickup", Pickup);
	
	return Pickup;
})());
