//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.BackForth");

/** @class dusk.behave.BackForth
 * @memberof dusk.behave
 * 
 * @classdesc An entity with this behaviour will move in one direction until it collides with something, and then head the other direction.
 * 
 * The speed it travels at is defined by the behaviour data value `"hspeed"`. Which is `1` by default.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.BackForth = function(entity) {
	dusk.behave.Behave.call(this, entity);
		
	this._data("hspeed", 1, true);
		
	this.entityEvent.listen(this._bfCollide, this, {"name":"collide"});
};
dusk.behave.BackForth.prototype = new dusk.behave.Behave();
dusk.behave.BackForth.constructor = dusk.behave.BackForth;

/** Used to manage collisions internally.
 * @param {object} e A "collide" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.BackForth.prototype._bfCollide = function(e) {
	if(e.dir == "l") {
		this._entity.dx = this._entity.behaviourData.hspeed;
	}
	if(e.dir == "r") {
		this._entity.dx = -this._entity.behaviourData.hspeed;
	}
};
