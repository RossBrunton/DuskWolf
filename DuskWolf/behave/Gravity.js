//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Gravity", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");

	/** @class dusk.behave.Gravity
	 * 
	 * @classdesc An entity with this behaviour will move down at a constant acceleration.
	 * 
	 * The acceleration is given by the behaviour property `"gravity"` (default 2), and the maximum speed is given by
	 * `"terminal"` (default 7).
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var Gravity = function(entity) {
		Behave.call(this, entity);
		
		this._data("gravity", 2, true);
		this._data("terminal", 7, true);
		
		this.entityEvent.listen(this._gravFrame, this, {"name":"frame"});
	};
	Gravity.prototype = Object.create(Behave.prototype);

	/** Used to manage collisions internally.
	 * @param {object} e A "collidedInto" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	Gravity.prototype._gravFrame = function(name, e) {
		if(this._entity.touchers(c.DIR_DOWN).length) {
			this._entity.applyDy("gravity", this._data("gravity"), 1, this._data("gravity"), this._data("terminal"));
		}else{
			this._entity.applyDy("gravity", this._data("gravity"), 1, this._data("gravity"), this._data("terminal"), true);
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Gravity.workshopData = {
		"help":"Will accelerate downwards.",
		"data":[
			["gravity", "integer", "Acceleration by gravity."],
			["terminal", "integer", "Fastest speed for gravity."],
		]
	};

	Object.seal(Gravity);
	Object.seal(Gravity.prototype);

	entities.registerBehaviour("Gravity", Gravity);
	
	return Gravity;
})());
