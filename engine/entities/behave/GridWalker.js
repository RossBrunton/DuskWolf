//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.PlayerGridWalker", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var controls = load.require("dusk.input.controls");
	
	/** Allows player control of a `dusk.entities.behave.GridWalker` behaviour.
	 * 
	 * If the `controlActive` behaviour property is true, this responds to the controls `entity_left`, `entity_right`,
	 *  `entity_up` or `entity_down` to make the `GridWalker` behaviour work.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - playerControl:boolean = true - If false, player control is disabled.
	 * 
	 * This is a classless behaviour.
	 * @see dusk.entities.behave.PlayerControl
	 */
	var PlayerGridWalker = {
		"playerControl":true,
		
		"controlActive":function(entity, e) {
			if(entity.eProp("playerControl")) {
				return controls.controlActive("entity_"+e.control);
			}
		}
	};
	
	entities.registerWorkshop("PlayerGridWalker", {
		"help":"Will allow the player to control it (gridwalker version).",
		"data":[
			["playerControl", "boolean", "Is player control enabled?", "true"],
		]
	});
	
	entities.registerBehaviour("PlayerGridWalker", PlayerGridWalker);
	
	controls.addControl("entity_left", 37, "0-0.5");
	controls.addControl("entity_right", 39, "0+0.5");
	controls.addControl("entity_up", 38, "1-0.5");
	controls.addControl("entity_down", 40, "1+0.5");
	
	return PlayerGridWalker;
})());


load.provide("dusk.entities.behave.GridWalker", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var c = load.require("dusk.sgui.c");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	
	/** Allows the entity to walk as if it was a grid.
	 * 
	 * The entity stays still, then when it has to move (either from an input or a script) it can go either left, right
	 *  up or down and moves along that path until it has reached the next grid square.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - gwspeed:integer = 4 - The speed the speed at which the entity moves.
	 * - gwmoving:boolean = false - If true, then the entity is moving via the grid walker.
	 * - gwtargetx:integer - While the entity is moving, this is the x destination it is moving to.
	 * - gwtargety:integer - While the entity is moving, this is the y destination it is moving to.
	 * - gwregion:dusk.tiles.sgui.TileRegion = null - If not null, then the entity will not be able to move out this region.
	 * - gwfacing:integer = 1 - One of the `dusk.sgui.c.DIR_` constants representing which direction the entity is
	 *  facing.
	 * - gwmoves:array - A move stack; if this is set, whenever this entity isn't moving, a move is poped from this
	 *  stack and the entity moves that way.
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var GridWalker = function(entity) {
		Behave.call(this, entity);
		
		this._data("gwspeed", 4, true);
		this._data("gwmoving", false, true);
		this._data("gwtargetx", 0, true);
		this._data("gwtargety", 0, true);
		this._data("gwregion", null, true);
		this._data("gwfacing", c.DIR_DOWN, true);
		this._data("gwmoves", [], true);
		
		this.entityEvent.listen(_frame.bind(this), "frame");
		this.entityEvent.listen(_horForce.bind(this), "horForce");
		this.entityEvent.listen(_verForce.bind(this), "verForce");
	};
	GridWalker.prototype = Object.create(Behave.prototype);
	
	/** Called on the `horForce` behaviour event to manage motion.
	 * @param e {object} The behaviour event.
	 */
	var _horForce = function(e) {
		if(this._data("gwmoving")) {
			var d = this._data("gwfacing");
			
			if(d == c.DIR_RIGHT) {
				return this._data("gwspeed");
			}else if(d == c.DIR_LEFT) {
				return -this._data("gwspeed");
			}
		}
		
		return 0;
	};
	
	/** Called on the `verForce` behaviour event to manage motion.
	 * @param e {object} The behaviour event.
	 */
	var _verForce = function(e) {
		if(this._data("gwmoving")) {
			var d = this._data("gwfacing");
			
			if(d == c.DIR_DOWN) {
				return this._data("gwspeed");
			}else if(d == c.DIR_UP) {
				return -this._data("gwspeed");
			}
		}
		
		return 0;
	};
	
	/** Called on the `frame` entity event to manage motion.
	 * @param e {object} The entity event.
	 */
	var _frame = function(e) {
		var startMove = false;
		var d = 0;
		
		// Check to see if there are any moves in the move stack or inputs
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
			
			// Old location
			var oldT = this._entity.scheme.tilePointIn(this._entity.x, this._entity.y);
			
			// New location
			var newT = this._entity.scheme.tilePointIn(this._entity.x, this._entity.y);
			this._entity.scheme.shiftTile(newT, d);
			
			// Check if the locations are different
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
			// If we are currently moving
			// We must be going in the direction we are facing
			var d = this._data("gwfacing");
			
			// For each direction, check if we have reached the target, otherwise keep moving
			if(d == c.DIR_RIGHT) {
				if(this._entity.x >= this._data("gwtargetx")) {
					this._entity.x = this._data("gwtargetx");
					this._data("gwmoving", false);
				}
			}else if(d == c.DIR_LEFT) {
				if(this._entity.x <= this._data("gwtargetx")) {
					this._entity.x = this._data("gwtargetx");
					this._data("gwmoving", false);
				}
			}else if(d == c.DIR_DOWN) {
				if(this._entity.y >= this._data("gwtargety")) {
					this._entity.y = this._data("gwtargety");
					this._data("gwmoving", false);
				}
			}else if(d == c.DIR_UP) {
				if(this._entity.y <= this._data("gwtargety")) {
					this._entity.y = this._data("gwtargety");
					this._data("gwmoving", false);
				}
			}
			
			// If we have stopped moving, fire the event and run this handler again
			if(!this._data("gwmoving")) {
				this._entity.behaviourFire("gwStopMove", 
					{"dir":d, "targetX":this._data("gwtargetx")/this._entity.width, 
					"targetY":this._data("gwtargety")/this._entity.height}
				);
				
				_frame.call(this, e);
			}
		}
	};
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
	 * @static
	 */
	GridWalker.workshopData = {
		"help":"Will move as if it were on a grid.",
		"data":[
			["gwspeed", "integer","The speed the speed at which the entity moves on the grid.", 4]
		]
	};
	
	entities.registerBehaviour("GridWalker", GridWalker);
	
	return GridWalker;
})());


load.provide("dusk.entities.behave.GridRecorder", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var c = load.require("dusk.sgui.c");
	
	/** While the entity moves around (via `dusk.entities.behave.GridWalker`) this records the movements and stores them in an
	 *  array.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - grmoves:array - Every time a move is made and `grrecording` is true, the move is pushed onto this stack.
	 * - grrecording:boolean = false - Moves will only be recorded if this is true.
	 * - grrange:integer = 0 - If `grsnap` is true, this is the maximum length a path can be.
	 * - grsnap:boolean = false - If true, if the length of the recorded moves is longer than `grrange` then the
	 *  shortest route that goes to the same tile is calculated and replaces the current one.
	 * - grregion:dusk.tiles.sgui.TileRegion = null - If set, the recorded path won't lead out of this region. If it tries, 
	 *  no moves are added, and the next time it enters the region a new path is calculated.
	 * - grregionto:dusk.tiles.sgui.TileRegion = null - If set, the path this entity takes will be inserted into the given
	 *  region.
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var GridRecorder = function(entity) {
		Behave.call(this, entity);
		
		this._data("grmoves", [], true);
		this._data("grrecording", false, true);
		this._data("grrange", 0, true);
		this._data("grregion", null, true);
		this._data("grregionto", null, true);
		this._data("grsnap", false, true);
		
		/** If the entity has left the region, this is set to true so we know to calculate the path next time it's in
		 *  the region.
		 * @type boolean
		 * @private
		 */
		this._leftRegion = false;
		
		this.entityEvent.listen(_startMove.bind(this), "gwStartMove");
		this.entityEvent.listen(_stopMove.bind(this), "gwStopMove");
	};
	GridRecorder.prototype = Object.create(Behave.prototype);
	
	/** Manages the start of a move.
	 * @param {object} e An event object.
	 * @private
	 */
	var _startMove = function(e) {
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
	
	/** Manages the end of a move.
	 * @param {object} e An event object.
	 * @private
	 */
	var _stopMove = function(e) {
		if(this._data("grrecording") && this._data("grregion").isIn(e.targetX, e.targetY)) {
			if(this._data("grregionto")) {
				this._data("grregionto").clear();
				this._data("grregion").followPathInto(this._data("grmoves"), this._data("grregionto"));
			}
		}
	};
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
	 * @static
	 */
	GridRecorder.workshopData = {
		"help":"Will record the path that has been taken.",
		"data":[
			["gwrange", "integer", "The maximum range of the recorded path.", "0"],
			["gwsnap", "boolean", "Should the maximum range should be enforced?", "false"],
		]
	};
	
	entities.registerBehaviour("GridRecorder", GridRecorder);
	
	return GridRecorder;
})());


load.provide("dusk.entities.behave.GridMouse", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var options = load.require("dusk.options");
	
	/** Allows mouse control for `dusk.entities.behave.GridWalker`.
	 * 
	 * This behaviour uses the following behaviour properties:
	 * - gmMouseMove:boolean = true - Whether the mouse should move the entity.
	 * 
	 * This behavior enables mouse support on it's entity, and adds the option `"controls.mouseGrid"` to enable or
	 *  disable.
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var GridMouse = function(entity) {
		Behave.call(this, entity);
		
		this._data("gmMouseMove", true, true);
		
		this.entityEvent.listen(_mouseMove.bind(this), "mouseMove");
	};
	GridMouse.prototype = Object.create(Behave.prototype);
	
	/** Manages mouse motion.
	 * @param {object} e An event object.
	 * @private
	 */
	var _mouseMove = function(e) {
		if(this._data("gmMouseMove") && options.get("controls.mouseGrid") && this._entity.active) {
			var destX = ~~((this._entity.x + this._entity.mouseX) / this._entity.width);
			var destY = ~~((this._entity.y + this._entity.mouseY) / this._entity.height);
			
			if(this._data("gwregion") == null || this._data("gwregion").isIn(destX, destY)) {
				this._entity.behaviourFire("gwStartMove", {"targetX":destX, "targetY":destY});
				this._entity.x = destX * this._entity.width;
				this._entity.y = destY * this._entity.height;
				this._entity.behaviourFire("gwStopMove", {"targetX":destX, "targetY":destY});
			}
		}
	};
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
	 * @static
	 */
	GridMouse.workshopData = {
		"help":"Will record the path that has been taken.",
		"data":[
			["gmMouseMove", "boolean", "Is mouse support enabled?", "true"]
		]
	};
	
	options.register("controls.mouseGrid", options.boolean, true,
		"Whether moving the mouse changes the location of grid selectors."
	);
	
	entities.registerBehaviour("GridMouse", GridMouse);
	
	return GridMouse;
})());
