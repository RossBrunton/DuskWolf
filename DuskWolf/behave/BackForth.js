//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.BackForth", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.behave.BackForth
	 * @memberof dusk.behave
	 * 
	 * @classdesc An entity with this behaviour will move in one direction until it collides with something, and then head
	 * the other direction.
	 * 
	 * The speed it travels at is defined by the behaviour data value `"hspeed"`. Which is `5` by default.
	 * 
	 * If `"backforthif"` is in the behavior data, then this entity will only move back and forth if that trigger is true.
	 * 
	 * @extends dusk.behave.Behave
	 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var BackForth = function(entity) {
		Behave.call(this, entity);
		
		this._data("hspeed", 5, true);
		this._data("backforthif", "", true);
		
		this.entityEvent.listen(this._bfCollide, this, {"name":"collide"});
		this.entityEvent.listen(this._bfFrame, this, {"name":"beforeMove"});
	};
	BackForth.prototype = Object.create(Behave.prototype);

	/** Called every frame to apply a force.
	 * @param {object} e A "frame" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	BackForth.prototype._bfFrame = function(e) {
		if(this._entity.evalTrigger(this._data("backforthif"))) {
			if(this._data("headingLeft")) {
				this._entity.applyDx("bf_move", -this._data("hspeed"), 1);
			}else{
				this._entity.applyDx("bf_move", this._data("hspeed"), 1);
			}
		}
	};

	/** Used to manage collisions internally.
	 * @param {object} e A "collide" event dispatched from `{@link dusk.behave.Behave.entityEvent}`.
	 * @private
	 */
	BackForth.prototype._bfCollide = function(e) {
		if(e.dir == c.DIR_LEFT) {
			this._data("headingLeft", false);
		}
		if(e.dir == c.DIR_RIGHT) {
			this._data("headingLeft", true);
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	BackForth.workshopData = {
		"help":"Will move side to side and bounce of walls.",
		"data":[
			["hspeed", "integer", "Horizontal speed.", "5"],
			["backforthif", "string", "Will only move back and forth if this trigger is true.", ""]
		]
	};

	Object.seal(BackForth);
	Object.seal(BackForth.prototype);

	entities.registerBehaviour("BackForth", BackForth);
	
	return BackForth;
})());
