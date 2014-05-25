//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Fall", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.behave.Fall
	 * 
	 * @classdesc An entity with this behaviour will move down a number of pixels
	 *  specified by the `fallSpeed` data property when landed on.
	 * 
	 * If this value is lower that the speed the entity is falling at,
	 *  it will appear as if the entity is standing on top of this.
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var Fall = function(entity) {
		Behave.call(this, entity);
		
		this._data("fallSpeed", 1, true);
		
		this.entityEvent.listen(this._fallFall, this, {"name":"collidedInto", "dir":c.DIR_UP});
	};
	Fall.prototype = Object.create(Behave.prototype);

	/** Used to manage collisions internally.
	 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	Fall.prototype._fallFall = function(name, e) {
		//this._entity.performMotion(0, this._entity.eProp("fallSpeed"));
		this._entity.applyDy("fall_fall", 1/*this._data("fallSpeed")*/);
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Fall.workshopData = {
		"help":"Will fall when collided with.",
		"data":[
			["fallSpeed", "integer", "The speed to fall."]
		]
	};

	Object.seal(Fall);
	Object.seal(Fall.prototype);

	entities.registerBehaviour("Fall", Fall);
	
	return Fall;
})());
