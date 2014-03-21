//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.controls");

dusk.load.provide("dusk.behave.GridRecorder");
dusk.load.provide("dusk.behave.GridWalker");
dusk.load.provide("dusk.behave.PlayerGridWalker");

dusk.behave.PlayerGridWalker = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("playerControl", true, true);
	
	this.entityEvent.listen(function(e) {
		if(this._data("playerControl")) {
			return dusk.controls.controlActive("entity_"+e.control);
		}
	}, this, {"name":"controlActive"});
	
	dusk.controls.addControl("entity_left", 37, "0-0.5");
	dusk.controls.addControl("entity_right", 39, "0+0.5");
	dusk.controls.addControl("entity_up", 38, "1-0.5");
	dusk.controls.addControl("entity_down", 40, "1+0.5");
};
dusk.behave.PlayerGridWalker.prototype = Object.create(dusk.behave.Behave.prototype);

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.PlayerGridWalker.workshopData = {
	"help":"Will allow the player to control it (gridwalker version).",
	"data":[
		["playerControl", "boolean", "If false, player control is disabled."],
	]
};

dusk.entities.registerBehaviour("PlayerGridWalker", dusk.behave.PlayerGridWalker);

// ----

dusk.behave.GridWalker = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("gwspeed", 4, true);
	this._data("gwmoving", false, true);
	this._data("gwtargetx", 0, true);
	this._data("gwtargety", 0, true);
	this._data("gwregion", "", true);
	this._data("gwfacing", dusk.sgui.c.DIR_DOWN, true);
	this._data("gwmoves", [], true);
	
	this.entityEvent.listen(this._gwFrame, this, {"name":"frame"});
};
dusk.behave.GridWalker.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.GridWalker.prototype._gwFrame = function(e) {
	var startMove = false;
	var d = 0;
	
	if(!this._data("gwmoving")) {
		if(this._data("gwmoves").length) {
			startMove = true;
			d = this._data("gwmoves").pop();
		}else if(this._controlActive("left")) {
			startMove = true;
			d = dusk.sgui.c.DIR_LEFT;
		}else if(this._controlActive("right")) {
			startMove = true;
			d = dusk.sgui.c.DIR_RIGHT;
		}else if(this._controlActive("up")) {
			startMove = true;
			d = dusk.sgui.c.DIR_UP;
		}else if(this._controlActive("down")) {
			startMove = true;
			d = dusk.sgui.c.DIR_DOWN;
		}
	}
	
	if(startMove && this._entity.scheme) {
		var oldT = this._entity.scheme.tilePointIn(this._entity.x, this._entity.y);
		var newT = this._entity.scheme.tilePointIn(this._entity.x, this._entity.y);
		
		this._entity.scheme.shiftTile(newT, d);
		
		if((oldT[2] != newT[2] || oldT[3] != newT[3]) && newT[4] < 100) {
			if(this._data("gwregion") == ""
			|| this._entity.container.container.getRegion().isInRegion(this._data("gwregion"), newT[2], newT[3])) {
				this._entity.behaviourFire("gwStartMove", {"dir":d, "targetX":newT[2], "targetY":newT[3]});
				this._data("gwmoving", true);
				this._data("gwfacing", d);
				this._data("gwtargetx", newT[2] * this._entity.scheme.tileWidth());
				this._data("gwtargety", newT[3] * this._entity.scheme.tileHeight());
			}
		}
		
		dusk.sgui.TileMap.tileData.free(oldT);
		dusk.sgui.TileMap.tileData.free(newT);
	}
	
	if(this._data("gwmoving")) {
		var d = this._data("gwfacing");
		
		if(d == dusk.sgui.c.DIR_RIGHT) {
			if(this._entity.x >= this._data("gwtargetx")) {
				this._entity.x = this._data("gwtargetx");
				this._data("gwmoving", false);
				this._gwFrame();
			}else{
				this._entity.applyDx("gw_move", this._data("gwspeed"), 1, 0, this._data("gwspeed"), false);
			}
		}else if(d == dusk.sgui.c.DIR_LEFT) {
			if(this._entity.x <= this._data("gwtargetx")) {
				this._entity.x = this._data("gwtargetx");
				this._data("gwmoving", false);
				this._gwFrame();
			}else{
				this._entity.applyDx("gw_move", -this._data("gwspeed"), 1, 0, -this._data("gwspeed"), false);
			}
		}else if(d == dusk.sgui.c.DIR_DOWN) {
			if(this._entity.y >= this._data("gwtargety")) {
				this._entity.y = this._data("gwtargety");
				this._data("gwmoving", false);
				this._gwFrame();
			}else{
				this._entity.applyDy("gw_move", this._data("gwspeed"), 1, 0, this._data("gwspeed"), false);
			}
		}else if(d == dusk.sgui.c.DIR_UP) {
			if(this._entity.y <= this._data("gwtargety")) {
				this._entity.y = this._data("gwtargety");
				this._data("gwmoving", false);
				this._gwFrame();
			}else{
				this._entity.applyDy("gw_move", -this._data("gwspeed"), 1, 0, -this._data("gwspeed"), false);
			}
		}
	}
};

dusk.behave.GridWalker.workshopData = {
	"help":"Will move as if it were on a grid.",
	"data":[
		
	]
};

dusk.entities.registerBehaviour("GridWalker", dusk.behave.GridWalker);

// ----

dusk.behave.GridRecorder = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("grmoves", [], true);
	this._data("grrecording", false, true);
	this._data("grrange", 0, true);
	this._data("grregion", 0, true);
	this._data("grsnap", false, true);
	
	this.entityEvent.listen(this._gwStartMove.bind(this), undefined, {"name":"gwStartMove"});
};
dusk.behave.GridRecorder.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.GridRecorder.prototype._gwStartMove = function(e) {
	if(this._data("grrecording")) {
		this._data("grmoves").push(e.dir);
		
		if(this._data("grsnap") && this._data("grmoves").length > this._data("grrange")) {
			this._data("grmoves", 
				this._entity.container.container.getRegion().pathTo(this._data("grregion"), e.targetX, e.targetY)
			);
		}
	}
};

dusk.behave.GridRecorder.workshopData = {
	"help":"Will record the path that has been taken.",
	"data":[
		
	]
};

dusk.entities.registerBehaviour("GridRecorder", dusk.behave.GridRecorder);
