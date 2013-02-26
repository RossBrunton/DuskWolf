//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Fall");

/** @class dusk.behave.Fall
 * 
 * @classdesc An entity with this behaviour will move down a number of pixels specified by the `fallSpeed` data property when landed on.
 * 
 * If this value is lower that the speed the entity is falling at, it will appear as if the entity is standing on top of this.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Fall = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("fallSpeed", 1, true);
		
		this.entityEvent.listen(this._fallFall, this, {"name":"collidedInto", "dir":"d"});
	}
};
dusk.behave.Fall.prototype = new dusk.behave.Behave();
dusk.behave.Fall.constructor = dusk.behave.Fall;

/** Used to manage collisions internally.
 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Fall.prototype._fallFall = function(name, e) {
	this._entity.performMotion(0, this._entity.eProp("fallSpeed"));
};
