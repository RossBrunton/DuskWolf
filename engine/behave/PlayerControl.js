//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.PlayerControl", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var controls = load.require("dusk.input.controls");
	
	var PlayerControl = function(entity) {
		Behave.call(this, entity);
		
		this._data("playerControl", true, true);
		
		this.entityEvent.listen((function(e) {
			if(this._data("playerControl")) {
				return controls.controlActive("entity_"+e.control);
			}
		}).bind(this), "controlActive");
	};
	PlayerControl.prototype = Object.create(Behave.prototype);

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	PlayerControl.workshopData = {
		"help":"Will allow the player to control it.",
		"data":[
			["playerControl", "boolean", "If false, player control is disabled."],
		]
	};

	Object.seal(PlayerControl);
	Object.seal(PlayerControl.prototype);
	
	controls.addControl("entity_left", 37, "0-");
	controls.addControl("entity_right", 39, "0+");
	controls.addControl("entity_jump", 65, 0);

	entities.registerBehaviour("PlayerControl", PlayerControl);
	
	return PlayerControl;
})());


load.provide("dusk.behave.LeftRightControl", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	
	var LeftRightControl = function(entity) {
		Behave.call(this, entity);
		
		this._data("haccel", 2, true);
		this._data("hspeed", 7, true);
		
		this.entityEvent.listen(this._lrControlFrame.bind(this), "frame");
	};
	LeftRightControl.prototype = Object.create(Behave.prototype);

	LeftRightControl.prototype._lrControlFrame = function(e) {
		if(this._controlActive("left")) {
			this._data("headingLeft", true);
			this._entity.applyDx("control_move", 0, 1, -this._data("haccel"), -this._data("hspeed"), true);
		}else if(this._controlActive("right")) {
			this._data("headingLeft", false);
			this._entity.applyDx("control_move", 0, 1, this._data("haccel"), this._data("hspeed"), true);
		}
	};

	LeftRightControl.workshopData = {
		"help":"Will move left and right on control input.",
		"data":[
			["haccel", "integer", "Acceleration left and right."],
			["hspeed", "integer", "Fastest speed left and right."],
		]
	};

	Object.seal(LeftRightControl);
	Object.seal(LeftRightControl.prototype);

	entities.registerBehaviour("LeftRightControl", LeftRightControl);
	
	return LeftRightControl;
})());
