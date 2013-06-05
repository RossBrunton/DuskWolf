//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Gravity");

/** @class dusk.behave.Gravity
 * 
 * @classdesc An entity with this behaviour will move down at a constant acceleration.
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.Gravity = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._data("gravity", 2, true);
		this._data("terminal", 7, true);
		
		this.entityEvent.listen(this._gravFrame, this, {"name":"frame"});
	}
};
dusk.behave.Gravity.prototype = new dusk.behave.Behave();
dusk.behave.Gravity.constructor = dusk.behave.Gravity;

/** Used to manage collisions internally.
 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
 * @private
 */
dusk.behave.Gravity.prototype._gravFrame = function(name, e) {
	if(this._entity.touchers(dusk.sgui.c.DIR_DOWN).length) {
		this._entity.applyDy("gravity", this._data("gravity"), 1, this._data("gravity"), this._data("terminal"));
	}else{
		this._entity.applyDy("gravity", this._data("gravity"), 1, this._data("gravity"), this._data("terminal"), true);
	}
};

Object.seal(dusk.behave.Gravity);
Object.seal(dusk.behave.Gravity.prototype);

dusk.entities.registerBehaviour("Gravity", dusk.behave.Gravity);
