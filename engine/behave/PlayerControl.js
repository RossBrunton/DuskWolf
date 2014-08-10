//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.PlayerControl", (function() {
	var entities = load.require("dusk.entities");
	var controls = load.require("dusk.input.controls");
	
	var PlayerControl = {
		"playerControl":true,
		
		"controlActive":function(ent, e) {
			if(ent.eProp("playerControl")) {
				return controls.controlActive("entity_"+e.control);
			}
		},
	};
	
	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	entities.registerWorkshop("PlayerControl", {
		"help":"Will allow the player to control it.",
		"data":[
			["playerControl", "boolean", "If false, player control is disabled."],
		]
	});
	
	controls.addControl("entity_left", 37, "0-");
	controls.addControl("entity_right", 39, "0+");
	controls.addControl("entity_jump", 65, 0);
	
	entities.registerBehaviour("PlayerControl", PlayerControl);
	
	return PlayerControl;
})());


load.provide("dusk.behave.LeftRightControl", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");
	
	var LeftRightControl = function(entity) {
		Behave.call(this, entity);
		
		this._data("haccel", 2, true);
		this._data("hspeed", 7, true);
		this._data("airhaccelmult", 1.0, true);
		this._data("fluidhaccelmult", {}, true);
		this._collide = false;
		
		this.entityEvent.listen(_collide.bind(this), "collide");
		this.entityEvent.listen(_frame.bind(this), "frame");
	};
	LeftRightControl.prototype = Object.create(Behave.prototype);
	
	var _frame = function(e) {
		var accel = this._data("haccel");
		if(!this._entity.touchers(c.DIR_DOWN).length) accel *= this._data("airhaccelmult");
		
		if(this._entity.underFluid() > 0.0 && this._entity.fluid.fluidType in this._data("fluidhaccelmult")) {
			accel *= this._data("fluidhaccelmult")[this._entity.fluid.fluidType];
		}
		
		if(this._controlActive("left") && !this._collide) {
			this._data("headingLeft", true);
			this._entity.applyDx("control_move", 0, 1, -accel, -this._data("hspeed"), true);
		}else if(this._controlActive("right") && !this._collide) {
			this._data("headingLeft", false);
			this._entity.applyDx("control_move", 0, 1, accel, this._data("hspeed"), true);
		}else if(!this._collide) {
			// No inputs, decay the speed
			if(this._data("lastMoveLeft")) {
				this._entity.applyDx("control_move", 0, 1, accel, 0, true);
			}else{
				this._entity.applyDx("control_move", 0, 1, -accel, -0, true);
			}
		}else{
			this._collide = false;
		}
	};
	
	var _collide = function(e) {
		if(e.dir == c.DIR_LEFT || e.dir == c.DIR_RIGHT) {
			this._collide = true;
		}
	};
	
	entities.registerWorkshop("LeftRightControl", {
		"help":"Will move left and right on control input.",
		"data":[
			["haccel", "integer", "Acceleration left and right."],
			["hspeed", "integer", "Fastest speed left and right."],
			["airhaccelmult", "float", "Multiplier for left and right acceleration when in the air."],
			["fluidhaccelmult", "object", "Multiplier for left and right acceleration when in a given fluid."],
		]
	});
	
	entities.registerBehaviour("LeftRightControl", LeftRightControl);
	
	return LeftRightControl;
})());
