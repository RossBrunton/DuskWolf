//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.PlayerGridWalker", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var controls = load.require("dusk.controls");
	
	var PlayerGridWalker = function(entity) {
		Behave.call(this, entity);
		
		this._data("playerControl", true, true);
		
		this.entityEvent.listen((function(e) {
			if(this._data("playerControl")) {
				return controls.controlActive("entity_"+e.control);
			}
		}).bind(this), "controlActive");
		
		controls.addControl("entity_left", 37, "0-0.5");
		controls.addControl("entity_right", 39, "0+0.5");
		controls.addControl("entity_up", 38, "1-0.5");
		controls.addControl("entity_down", 40, "1+0.5");
	};
	PlayerGridWalker.prototype = Object.create(Behave.prototype);

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	PlayerGridWalker.workshopData = {
		"help":"Will allow the player to control it (gridwalker version).",
		"data":[
			["playerControl", "boolean", "If false, player control is disabled."],
		]
	};

	entities.registerBehaviour("PlayerGridWalker", PlayerGridWalker);
	
	return PlayerGridWalker;
})());


load.provide("dusk.behave.GridWalker", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");
	var TileMap = load.require("dusk.sgui.TileMap");
	
	var GridWalker = function(entity) {
		Behave.call(this, entity);
		
		this._data("gwspeed", 4, true);
		this._data("gwmoving", false, true);
		this._data("gwtargetx", 0, true);
		this._data("gwtargety", 0, true);
		this._data("gwregion", null, true);
		this._data("gwfacing", c.DIR_DOWN, true);
		this._data("gwmoves", [], true);
		
		this.entityEvent.listen(this._gwFrame.bind(this), "frame");
	};
	GridWalker.prototype = Object.create(Behave.prototype);

	GridWalker.prototype._gwFrame = function(e) {
		var startMove = false;
		var d = 0;
		
		if(!this._data("gwmoving") && e.active) {
			if(this._data("gwmoves").length) {
				startMove = true;
				d = this._data("gwmoves").pop();
			}else if(this._controlActive("left")) {
				startMove = true;
				d = c.DIR_LEFT;
			}else if(this._controlActive("right")) {
				startMove = true;
				d = c.DIR_RIGHT;
			}else if(this._controlActive("up")) {
				startMove = true;
				d = c.DIR_UP;
			}else if(this._controlActive("down")) {
				startMove = true;
				d = c.DIR_DOWN;
			}
		}
		
		if(startMove && this._entity.scheme) {
			//Try to move
			var oldT = this._entity.scheme.tilePointIn(this._entity.x, this._entity.y);
			var newT = this._entity.scheme.tilePointIn(this._entity.x, this._entity.y);
			
			this._entity.scheme.shiftTile(newT, d);
			
			if(((oldT[2] != newT[2] || oldT[3] != newT[3]) && !newT[5]) || !this._data("collides")) {
				if(this._data("gwregion") == null || this._data("gwregion").isIn(newT[2], newT[3])) {
					this._entity.behaviourFire("gwStartMove", {"dir":d, "targetX":newT[2], "targetY":newT[3]});
					this._data("gwmoving", true);
					this._data("gwfacing", d);
					this._data("gwtargetx", newT[2] * this._entity.scheme.tileWidth());
					this._data("gwtargety", newT[3] * this._entity.scheme.tileHeight());
				}
			}
			
			TileMap.tileData.free(oldT);
			TileMap.tileData.free(newT);
		}
		
		if(this._data("gwmoving")) {
			var d = this._data("gwfacing");
			
			if(d == c.DIR_RIGHT) {
				if(this._entity.x >= this._data("gwtargetx")) {
					this._entity.x = this._data("gwtargetx");
					this._data("gwmoving", false);
				}else{
					this._entity.applyDx("gw_move", this._data("gwspeed"), 1, 0, this._data("gwspeed"), false);
				}
			}else if(d == c.DIR_LEFT) {
				if(this._entity.x <= this._data("gwtargetx")) {
					this._entity.x = this._data("gwtargetx");
					this._data("gwmoving", false);
				}else{
					this._entity.applyDx("gw_move", -this._data("gwspeed"), 1, 0, -this._data("gwspeed"), false);
				}
			}else if(d == c.DIR_DOWN) {
				if(this._entity.y >= this._data("gwtargety")) {
					this._entity.y = this._data("gwtargety");
					this._data("gwmoving", false);
				}else{
					this._entity.applyDy("gw_move", this._data("gwspeed"), 1, 0, this._data("gwspeed"), false);
				}
			}else if(d == c.DIR_UP) {
				if(this._entity.y <= this._data("gwtargety")) {
					this._entity.y = this._data("gwtargety");
					this._data("gwmoving", false);
				}else{
					this._entity.applyDy("gw_move", -this._data("gwspeed"), 1, 0, -this._data("gwspeed"), false);
				}
			}
			
			if(!this._data("gwmoving")) {
				this._entity.behaviourFire("gwStopMove", 
					{"dir":d, "targetX":this._data("gwtargetx")/this._entity.width, 
					"targetY":this._data("gwtargety")/this._entity.height}
				);
				
				this._gwFrame(e);
			}
		}
	};

	GridWalker.workshopData = {
		"help":"Will move as if it were on a grid.",
		"data":[
			
		]
	};

	entities.registerBehaviour("GridWalker", GridWalker);
	
	return GridWalker;
})());


load.provide("dusk.behave.GridRecorder", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var c = load.require("dusk.sgui.c");
	
	var GridRecorder = function(entity) {
		Behave.call(this, entity);
		
		this._data("grmoves", [], true);
		this._data("grrecording", false, true);
		this._data("grrange", 0, true);
		this._data("grregion", null, true);
		this._data("grregionto", null, true);
		this._data("grsnap", false, true);
		
		this._leftRegion = false;
		
		this.entityEvent.listen(this._gwStartMove.bind(this), "gwStartMove");
		this.entityEvent.listen(this._gwStopMove.bind(this), "gwStopMove");
	};
	GridRecorder.prototype = Object.create(Behave.prototype);

	GridRecorder.prototype._gwStartMove = function(e) {
		if(this._data("grrecording")
		&& this._data("grregion").isIn(e.targetX, e.targetY)) {
			var moves = this._data("grmoves");
			
			if("dir" in e && moves.length) {
				moves.push(e.dir);
				
				if((moves[moves.length-1] | moves[moves.length-2]) == (c.DIR_UP | c.DIR_DOWN))
					moves.splice(-2, 2);
				
				if((moves[moves.length-1] | moves[moves.length-2]) == (c.DIR_LEFT | c.DIR_RIGHT))
					moves.splice(-2, 2);
			}
			
			if(this._leftRegion || (this._data("grsnap") && moves.length > this._data("grrange")) || !("dir" in e)
			|| !moves.length) {
				this._data("grmoves", 
					this._data("grregion").pathTo(e.targetX, e.targetY)
				);
				this._leftRegion = false;
			}
		}else if(this._data("grrecording")) {
			this._leftRegion = true;
		}
	};

	GridRecorder.prototype._gwStopMove = function(e) {
		if(this._data("grrecording") && this._data("grregion").isIn(e.targetX, e.targetY)) {
			if(this._data("grregionto")) {
				this._data("grregionto").clear();
				this._data("grregion").followPathInto(this._data("grmoves"), this._data("grregionto"));
			}
		}
	};

	GridRecorder.workshopData = {
		"help":"Will record the path that has been taken.",
		"data":[
			
		]
	};

	entities.registerBehaviour("GridRecorder", GridRecorder);
	
	return GridRecorder;
})());


load.provide("dusk.behave.GridMouse", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var options = load.require("dusk.options");
	
	var GridMouse = function(entity) {
		Behave.call(this, entity);
		
		this._data("gmMouseMove", true, true);
		
		this.entityEvent.listen((function(e){this._entity.ensureMouse()}).bind(this), "typeChange");
		this.entityEvent.listen(this._gmMouseMove.bind(this), "mouseMove");
	};
	GridMouse.prototype = Object.create(Behave.prototype);

	GridMouse.prototype._gmMouseMove = function(e) {
		if(this._data("gmMouseMove") && options.get("controls.mouseGrid") && this._entity.active) {
			var destX = ~~((this._entity.x + e.x) / this._entity.width);
			var destY = ~~((this._entity.y + e.y) / this._entity.height);
			
			if(this._data("gwregion") == null || this._data("gwregion").isIn(destX, destY)) {
				this._entity.behaviourFire("gwStartMove", {"targetX":destX, "targetY":destY});
				this._entity.x = destX * this._entity.width;
				this._entity.y = destY * this._entity.height;
				this._entity.behaviourFire("gwStopMove", {"targetX":destX, "targetY":destY});
			}
		}
	};

	GridMouse.workshopData = {
		"help":"Will record the path that has been taken.",
		"data":[
			
		]
	};

	options.register("controls.mouseGrid", "boolean", true,
		"Whether moving the mouse changes the location of grid selectors."
	);

	entities.registerBehaviour("GridMouse", GridMouse);
	
	return GridMouse;
})());
