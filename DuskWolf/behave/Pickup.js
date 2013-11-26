//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Pickup");

/* * @class dusk.behave.Pickup
 * @memberof dusk.behave
 * 
 * @classdesc 
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Pickup = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("type", "coin", true);
	this._data("value", 1, true);
	this._data("roomLinked", true, true);
	this._data("pickupBy", "", true);
	
	this.entityEvent.listen(this._pickCollided, this, {"name":"collidedInto"});
	this.entityEvent.listen(this._pickLoad, this, {"name":"typeChange"});
};
dusk.behave.Pickup.prototype = new dusk.behave.Behave();
dusk.behave.Pickup.constructor = dusk.behave.Pickup;

/** Used to manage collisions internally.
 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Pickup.prototype._pickCollided = function(e) {
	var name = this._entity.comName;
	if(this._data("pickupName")) name = this._data("pickupName");
	if(!e.target.meetsTrigger(this._data("pickupBy"))) return;
	
	var room = "*";
	if(this._data("roomLinked") && this._entity.path("..")) room = this._entity.path("../..").roomName;
	
	if(!dusk.behave.Pickup.collected(this._data("type"), name, room) && this._entity.behaviourFire("pickup",
	  {"type":this._data("type"), "value":this._data("value"), "target":e.target}).indexOf(true) === -1
	) {
		
		dusk.behave.Pickup.collect(this._data("type"), this._data("value"), name, room);
		
		this._entity.terminate();
	}
};

dusk.behave.Pickup.prototype._pickLoad = function(e) {
	var name = this._entity.comName;
	if(this._data("pickupName")) name = this._data("pickupName");
	
	var room = "*";
	if(this._data("roomLinked") && this._entity.path("../..")) room = this._entity.path("../..").roomName;
	
	if(dusk.behave.Pickup.collected(this._data("type"), name, room)) this._entity.deleted = true;
};

dusk.behave.Pickup._collected = {};
dusk.behave.Pickup._counts = {};

dusk.behave.Pickup.collect = function(type, value, name, room) {
	if(room === undefined) room = "*";
	if(!(type in dusk.behave.Pickup._collected)) dusk.behave.Pickup._collected[type] = [];
	if(name !== "*") 
		dusk.behave.Pickup._collected[type][dusk.behave.Pickup._collected[type].length] = [value, name, room];
	
	if(!(type in dusk.behave.Pickup._counts)) dusk.behave.Pickup._counts[type] = 0;
	dusk.behave.Pickup._counts[type] += value;
};

dusk.behave.Pickup.count = function(type, room) {
	if(!(type in dusk.behave.Pickup._counts)) return 0;
	return dusk.behave.Pickup._counts[type];
};

dusk.behave.Pickup.collected = function(type, name, room) {
	if(!(type in dusk.behave.Pickup._collected)) return false;
	if(name === "*") return false;
	for(var i = dusk.behave.Pickup._collected[type].length-1; i >= 0; i --) {
		if(dusk.behave.Pickup._collected[type][i][2] === room || room == "*" || !room) {
			if(dusk.behave.Pickup._collected[type][i][1] == name) return true;
		}
	}
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.Pickup.workshopData = {
	"help":"Will be pickupable and collectable.",
	"data":[
		["type", "string", "The collectable type."],
		["value", "integer", "How much it rises how much you have by."],
		["roomLinked", "boolean", "Should be true unless you give each one a unique name."],
		["pickupBy", "string", "Trigger criteria for entities that can pick this up."],
	]
};

Object.seal(dusk.behave.Pickup);
Object.seal(dusk.behave.Pickup.prototype);

dusk.entities.registerBehaviour("Pickup", dusk.behave.Pickup);
