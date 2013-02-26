//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Push");

/** @class dusk.behave.Push
 * @memberof dusk.behave
 * 
 * @classdesc An entity with this behaviour will, when hit from any direction, will move in that direction a number of pixels specified with the `speed` property.
 * 
 * This can be used to make pushable blocks.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Push = function(entity, events) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity, events);
		
		this._data("speed", 1, true);
		
		this.entityEvent.listen(this._pCollided, this, {"name":"collidedInto"});
	}
};
dusk.behave.Push.prototype = new dusk.behave.Behave();
dusk.behave.Push.constructor = dusk.behave.Push;

/** Used to manage collisions internally.
 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Push.prototype._pCollided = function(e) {
	switch(e.dir) {
		case "d": this._entity.performMotion(0, this._entity.behaviourData.speed);break;
		case "u": this._entity.performMotion(0, -this._entity.behaviourData.speed); break;
		case "r": this._entity.performMotion(this._entity.behaviourData.speed, 0); break;
		case "l": this._entity.performMotion(-this._entity.behaviourData.speed, 0); break;
	}
};
