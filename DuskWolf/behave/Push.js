//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Push");

/** @class dusk.behave.Push
 * @memberof dusk.behave
 * 
 * @classdesc An entity with this behaviour will, when hit from any direction, 
 *  will move in that direction a number of pixels specified with the `speed` property.
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
		case dusk.sgui.c.DIR_DOWN: this._entity.applyDy("push_push", -this._data("speed"), 1);break;
		case dusk.sgui.c.DIR_UP: this._entity.applyDy("push_push", this._data("speed"), 1);break;
		case dusk.sgui.c.DIR_RIGHT: this._entity.applyDx("push_push", -this._data("speed"), 1);break;
		case dusk.sgui.c.DIR_LEFT: this._entity.applyDx("push_push", this._data("speed"), 1);break;
	}
};

Object.seal(dusk.behave.Push);
Object.seal(dusk.behave.Push.prototype);

dusk.entities.registerBehaviour("Push", dusk.behave.Push);
