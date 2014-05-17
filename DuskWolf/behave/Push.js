//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Push", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");

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
	var Push = function(entity) {
		Behave.call(this, entity);
		
		this._data("pspeed", 1, true);
		
		this.entityEvent.listen(this._pCollided, this, {"name":"collidedInto"});
	};
	Push.prototype = Object.create(Behave.prototype);

	/** Used to manage collisions internally.
	 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	Push.prototype._pCollided = function(e) {
		switch(e.dir) {
			case c.DIR_DOWN: this._entity.applyDy("push_push", -this._data("pspeed"), 1);break;
			case c.DIR_UP: this._entity.applyDy("push_push", this._data("pspeed"), 1);break;
			case c.DIR_RIGHT: this._entity.applyDx("push_push", -this._data("pspeed"), 1);break;
			case c.DIR_LEFT: this._entity.applyDx("push_push", this._data("pspeed"), 1);break;
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Push.workshopData = {
		"help":"Will move when pushed.",
		"data":[
			["pspeed", "integer", "Speed to move when pushed."],
		]
	};

	Object.seal(Push);
	Object.seal(Push.prototype);

	entities.registerBehaviour("Push", Push);
	
	return Push;
})());
