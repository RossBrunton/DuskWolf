//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Volatile");

/** @class dusk.behave.Volatile
 * @memberof dusk.behave
 * 
 * @classdesc An entity with this behaviour will be terminated when it collides with a specific entity or a wall.
 * 
 * The entity it collides with must match a trigger specified by the behaviour property `"killedBy"`, which by default
 * is an empty string.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Volatile = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("killedBy", "", true);
	
	this.entityEvent.listen(this._vCollide, this, {"name":"collide"});
};
dusk.behave.Volatile.prototype = Object.create(dusk.behave.Behave.prototype);

/** Used to manage collisions internally.
 * @param {object} e A "collide" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Volatile.prototype._vCollide = function(e) {
	if(e.target !== "wall") {
		if(!e.target.meetsTrigger(this._data("killedBy"))) return;
	}
	this._entity.terminate();
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.Volatile.workshopData = {
	"help":"Will be removed if it hits a wall or entity.",
	"data":[
		["killedBy", "string", "A trigger that is true for all entities that can remove this on collision.", "\"\""]
	]
};

Object.seal(dusk.behave.Volatile);
Object.seal(dusk.behave.Volatile.prototype);

dusk.entities.registerBehaviour("Volatile", dusk.behave.Volatile);
