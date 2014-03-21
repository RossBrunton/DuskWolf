//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.controls");
dusk.load.require("dusk.skills");

dusk.load.provide("dusk.behave.PlayerControl");
dusk.load.provide("dusk.behave.LeftRightControl");

dusk.behave.PlayerControl = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("playerControl", true, true);
	
	this.entityEvent.listen(function(e) {
		if(this._data("playerControl")) {
			return dusk.controls.controlActive("entity_"+e.control);
		}
	}, this, {"name":"controlActive"});
	
	dusk.controls.addControl("entity_left", 37, "0-0.5");
	dusk.controls.addControl("entity_right", 39, "0+0.5");
	dusk.controls.addControl("entity_jump", 65, 0);
};
dusk.behave.PlayerControl.prototype = Object.create(dusk.behave.Behave.prototype);

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.PlayerControl.workshopData = {
	"help":"Will allow the player to control it.",
	"data":[
		["playerControl", "boolean", "If false, player control is disabled."],
	]
};

Object.seal(dusk.behave.PlayerControl);
Object.seal(dusk.behave.PlayerControl.prototype);

dusk.entities.registerBehaviour("PlayerControl", dusk.behave.PlayerControl);

// ----

dusk.behave.LeftRightControl = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("haccel", 2, true);
	this._data("hspeed", 7, true);
	
	this.entityEvent.listen(this._lrControlFrame, this, {"name":"frame"});
};
dusk.behave.LeftRightControl.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.LeftRightControl.prototype._lrControlFrame = function(e) {
	if(this._controlActive("left")) {
		this._data("headingLeft", true);
		this._entity.applyDx("control_move", 0, 1, -this._entity.eProp("haccel"), -this._entity.eProp("hspeed"), true);
	}else if(this._controlActive("right")) {
		this._data("headingLeft", false);
		this._entity.applyDx("control_move", 0, 1, this._entity.eProp("haccel"), this._entity.eProp("hspeed"), true);
	}
};

dusk.behave.LeftRightControl.workshopData = {
	"help":"Will move left and right on control input.",
	"data":[
		["haccel", "integer", "Acceleration left and right."],
		["hspeed", "integer", "Fastest speed left and right."],
	]
};

Object.seal(dusk.behave.LeftRightControl);
Object.seal(dusk.behave.LeftRightControl.prototype);

dusk.entities.registerBehaviour("LeftRightControl", dusk.behave.LeftRightControl);
