//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.sgui.Entity", (function() {
	var Tile = load.require("dusk.tiles.sgui.Tile");
	var utils = load.require("dusk.utils");
	var parseTree = load.require("dusk.utils.parseTree");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require("dusk.sgui");
	var interaction = load.require("dusk.input.interaction");
	var editor = load.suggest("dusk.rooms.editor", function(p){editor = p;});
	var AnimatedTile = load.require("dusk.tiles.sgui.extras.AnimatedTile");
	
	/** An entity is a component that has "behaviours" and can do certain activites, possibly in response to another
	 *  entities or user input.
	 * 
	 * It is a normal tile with a movement system, a collision system and a behaviour system added
	 *  onto it.
	 * 
	 * Entities have a type, which describes how they look and what behaviours they have. This is set by the `entType`
	 *  property, and the types are managed by `dusk.entities`. The documentation there gives a good description of what
	 *  is required to specify a type.
	 * 
	 * The movement system works along the lines of each entity having a `dx` and `dy` value, which determine its
	 *  horizontal and vertical speed respectivley. The speed is calculated by behaviours that respond to the "horForce"
	 *  and "verForce" entity events. The event handlers supply either a constant speed to move at that frame or a
	 *  `[acceleration, max, name]` triple.
	 * 
	 * Entities can collide with each other, if they are in a `dusk.entities.sgui.EntityGroup`. The collision hit box is
	 * a rectangle from the coordinates (`x+collisionOffestX`, `y+collisionOffestY`) to (`x+collisionWidth`,
	 *  `y+collisionHeight`). The function `touchers` can be used to get a list of components touching this one on the
	 *  specified side.
	 * 
	 * Entities can have behaviours on them. Behaviours available are as an object on the `behaviours` property of the
	 *  entity type description. Each key of this object is the name of a behaviour, while the value is a boolean for
	 *  whether the entity should have this behaviour.
	 * 
	 * Behaviours are subclasses of `Behave`, and must be registered using `dusk.entities.registerBehaviour` before they
	 * can be used. Entity behaviours share an object `behaviourData` which is used for storing and retrieving values,
	 * and can be accessed using `eProp` or `dusk.entities.behave.Behave._data`. By convention, the keys are of the form
	 * `"behaviourName:varName"` or `"_behaviourName:_privateVarName"`.
	 * 
	 * A number of "built in" entity data properties are available:
	 * 
	 * - `collides`: A boolean default true; true if this entity can collide with other entities.
	 * - `solid`: A boolean default true; true if this entity can be collided into by other entities.
	 * - `lastMoveLeft`: A boolean, which is true if the last time this entity moved, it moved left.
	 * - `lastMoveUp`: A boolean, which is true if the last time this entity moved, it moved up.
	 * - `headingLeft`: A boolean, which is true if the entity is "heading left", whatever that means.
	 * - `headingUp`: A boolean, which is true if the entity is "heading up".
	 * - `controlsOn`: An array of controls that are always on.
	 * - `img`: A string, the path to the source image.
	 * - `collisionWidth`,`collisionHeight`,`collisionOffsetX`,`collisionOffsetY`: Mapping to the respective properties.
	 * - `animations`: The animations for this entity, as per `dusk.tiles.sgui.extras.AnimatedTile`.
	 * - `animationRate`: The value for the `rate` property of the animation.
	 * 
	 * Behaviours may also fire and listen to events between themselves and their entity. Events are fired using
	 *  `behaviourFire` and listened to on each behaviour's `Behave.entityEvent` dispatcher.
	 * 
	 * Each event has a name and an object event. On the event object as listened to, the name of the event will be the
	 *  `name` property of the event object.
	 * 
	 * There are some "built in" events:
	 * 
	 * - `typeChange`: Called when the entity has just finished changing types to the current one. Event object is
	 *  empty.
	 * - `beforeMove`: Called just before the collisions are to be resolved, the event object is empty.
	 * - `frame`: Called once per frame, after the collisions are resolved, and before the entities are drawn.
	 *  Event object is empty.
	 * - `animation`: Called when an animation event is fired using `!`. The event object has one property, `given`,
	 *  which is the bit after the `!` character.
	 * - `terminate`: Called when the entity is about to be terminated, the listener should return true if they don't
	 *  want the entity to terminate. The event object has no properties.
	 * - `delete`: Called when the entity is deleted.
	 * - `collide`: Fired by `{@link dusk.entities.sgui.EntityGroup}` when this entity collides into another entity or a wall.
	 *  The event object has two properties; `dir` a dusk.sgui.c.DIR_* constant representing the side that collided, and
	 *  `target`, the entity that it collided into, or the string `"wall"`.
	 * - `collidedInto`: Fired by `{@link dusk.entities.sgui.EntityGroup}` when this is collided into by another entity. The
	 *  event object has two properties; `dir` a dusk.sgui.c.DIR_* constant representing the side that collided, and
	 *  `target`, the entity that collided into this one.
	 * - `controlActive`: Fired by all behaviours when they want to check a control is active. A listener should return
	 *  true if they want to declare that the control is active. This has one property, `control`, the name of the
	 *  control. If the entity data has an array `controlsOn` that contains the control name, then this event is not
	 *  fired, and the control is assumed on.
	 * - `horForce`: The horizontal force, behaviours should return either an integer (for constant speed) or
	 *  `[acceleration, max, name]` for acceleration.
	 * - `verForce`: Vertical force, behaves in the same way as `horForce`.
	 * - `affectHorForce`: The event object has a property `forces` which is an array of outputs from `horForce` or
	 *  undefineds which can be modified by other behaviours if they wish.
	 * - `affectVerForce`: Similar to `affectHorForce`.
	 * 
	 * The events go in the order every frame: `verForce`, `affectVerForce`, `horForce`, `affectHorForce`, `beforeMove`,
	 *  any collision events, `frame`.
	 * 
	 * There are "triggers", which are essentially strings that evaluate into a constant value according to rules. They
	 *  are used in animation and particle effects, as the first element of the array where they are checked if they are
	 *  true or false. They are also used in behaviours, to allow a more fine control on what they interact with.
	 * 
	 * They are essentially fed to a parse tree from `dusk.utils.parseTree`, and support the following operators, low to high
	 *  priority, in addition to the basic ones:
	 * 
	 * - `on event`: True iff this trigger is being evaluated because of the animation event `event`. This will cause a
	 *  lock to be set on the current animation if it's in that context.
	 * - `#dx`: The entity's horizontal speed.
	 * - `#dy`: The entity's vertical speed.
	 * - `#tb`: The number of entities touching the bottom of this.
	 * - `#tu`: The number of entities touching the top of this.
	 * - `#tl`: The number of entities touching the left of this.
	 * - `#tr`: The number of entities touching the right of this.
	 * - `#path`: The path to this entity.
	 * - `#edit`: True if the editor is on, otherwise false.
	 * - `.var`: The value of the component property `var`.
	 * - `:var`: The value of the entity data property `var`.
	 * 
	 * All entities have an `dusk.tile.sgui.extras.AnimatedTile` object attached to them, called `animation`.
	 * 
	 * @extends dusk.tiles.sgui.Tile
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @constructor
	 */
	var Entity = function(parent, name) {
		Tile.call(this, parent, name);
		
		//Settings
		this.addExtra("AnimatedTile", "animation", {});
		
		/** The current horizontal speed. This may be read, but not set directly; use the `horForce` behaviour event.
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.dx = 0;
		/** The current vertical speed. This may be read, but not set directly; use the `verForce` behaviour event.
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.dy = 0;
		
		/** Accumulated dx. Key is source and value is the accumulated speed from that source.
		 * @type object
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._dxAccum = {};
		/** Accumulated dy. Key is source and value is the accumulated speed from that source.
		 * @type object
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._dyAccum = {};
		
		/** All the behaviours that this entity is using. Each key name is the name of the behaviour,
		 *  and the value is a `{@link dusk.entities.behave.Behave}` instance.
		 * @type object
		 * @private
		 */
		this._behaviours = {};
		/** Listeners for classless behaviours. Key is behavour event name, and value is an array of functions to call.
		 * @type object
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._behaviourListeners = {};
		/** The entity's behaviour data. This is data used by the entity's behaviour objects. It
		 *  it contains stuff such as HP and gravity.
		 * @type object
		 */
		this.behaviourData = {};
		/** An event disptacher that fires when an entity event happens.
		 * 
		 * Firing this event does nothing, use `{@link dusk.entities.sgui.Entity#behaviourFire}` instead.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.entityEvent = new EventDispatcher("dusk.entities.sgui.Entity.entityEvent");
		
		/** The arrays of entities touching this entity. Keys are directions, while values are arrays 
		 *  of entities that are touching it, or the string `"wall"`.
		 * @type object
		 * @private
		 */
		this._touchers = {};
		this._touchers[c.DIR_UP] = [];
		this._touchers[c.DIR_DOWN] = [];
		this._touchers[c.DIR_LEFT] = [];
		this._touchers[c.DIR_RIGHT] = [];
		
		/** The arrays of entities, including non-solid ones touching this entity. Keys are directions, while values are
		 *  arrays of entities that are touching it, or the string `"wall"`.
		 * @type object
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._touchersNonSolid = {};
		this._touchersNonSolid[c.DIR_UP] = [];
		this._touchersNonSolid[c.DIR_DOWN] = [];
		this._touchersNonSolid[c.DIR_LEFT] = [];
		this._touchersNonSolid[c.DIR_RIGHT] = [];
		
		/** The offset for the x coordinate for this entity's hitbox.
		 * @type integer
		 */
		this.collisionOffsetX = 0;
		/** The offset for the y coordinate for this entity's hitbox.
		 * @type integer
		 */
		this.collisionOffsetY = 0;
		/** The width of this entity's hitbox plus `collisionOffsetX`.
		 * @type integer
		 */
		this.collisionWidth = 0;
		/** The height of this entity's hitbox plus `collisionOffsetY`.
		 * @type integer
		 */
		this.collisionHeight = 0;
		
		/** If not empty, then a rectangle of this colour will be drawn showing the entity's hitbox.
		 * @type string
		 * @default ""
		 */
		this.collisionMark = "";
		
		/** The `dusk.tiles.sgui.TileMap` instance that serves as this entity's schematic layer.
		 * 
		 * This will be used to calculate collisions with wall.
		 * @type ?dusk.tiles.sgui.TileMap
		 */
		this.scheme = null;
		/** The path to the scheme instance. Setting this will update the scheme instance.
		 * @type string
		 */
		this.schemePath = null;
		/** The `dusk.rooms.sgui.FluidLayer` instance that this will use.
		 * @type ?dusk.rooms.sgui.FluidLayer
		 */
		this.fluid = null;
		/** The path to the particle field instance. Setting this will update it.
		 * @type string
		 */
		this.fluidPath = null;
		
		/** Use this to check if the entity is terminated or not, this is set to true by
		 *  `{@link dusk.entities.sgui.Entity#terminate}`, and means the entity is set for deleting when an
		 *  animation is finished. Please do not set this property directly.
		 * @type boolean
		 */
		this.terminated = false;
		
		//this._teatherClients = [];
		//this._teatherHost = null;
		
		//Not implemented yet
		this.iltr = 0;
		this.irtl = 0;
		this.ittb = 0;
		this.ibtt = 0;
		
		/** Internal storage of this entity's type's name.
		 * @type string
		 * @private
		 */
		this._type = "";
		/** The entity's type. This is the string name of the type in `{@link dusk.entities.types}`.
		 *  Setting this value will change the entity's type, changing its behaviours and animations.
		 * @type string
		 */
		this.entType = "root";
		
		/** The stats system that is associated with this entity; if it has one.
		 * @type dusk.stats.LayeredStatsSystem
		 * @since 0.0.21-alpha
		 */
		this.stats = null;
		
		//Default sizes
		this.width = entities.twidth;
		this.height = entities.theight;
		
		//Prop masks
		//this._mapper.map("dx", "dx");
		//this._mapper.map("dy", "dy");
		this._mapper.map("scheme", "schemePath");
		this._mapper.map("particles", "particlesPath");
		this._mapper.map("fluid", "fluidPath");
		this._mapper.map("entType", "entType");
		
		//Listeners
		if(this.collisionMark) this.onPaint.listen(this._collisionPaint.bind(this));
		this.onInteract.listen((function() {
			this.behaviourFire("mouseMove", {"x":this.mouseX, "y":this.mouseY});
			return true;
		}).bind(this), interaction.MOUSE_MOVE);
		
		this.onDelete.listen((function(e) {
			this.behaviourFire("delete", e);
		}).bind(this));
	};
	Entity.prototype = Object.create(Tile.prototype);
	
	//Basic getters and setters
	//schemePath
	Object.defineProperty(Entity.prototype, "schemePath", {
		get: function() {
			return this.scheme?this.scheme.fullPath():undefined;
		},
		
		set: function(value) {
			if(value) this.scheme = this.path(value);
		}
	});
	
	//fluidPath
	Object.defineProperty(Entity.prototype, "fluidPath", {
		get: function() {
			return this.fluid?this.fluid.fullPath():undefined;
		},
		
		set: function(value) {
			if(value) this.fluid = this.path(value);
		}
	});
	
	//entType
	Object.defineProperty(Entity.prototype, "entType", {
		get: function() {
			return this._type;
		},
		
		set: function(type) {
			// Get data
			this._type = type;
			
			if(entities.types.isValidType(type)) {
				this.behaviourData = utils.copy(entities.types.getAll(type).data, true);
				this.getExtra("animation").setAnimations(utils.copy(entities.types.getAll(type).animation, true));
			}else{
				this.behaviourData = {"headingLeft":false, "headingUp":false, "img":"nosuchimage.png",
					"solid":true, "collides":true
				};
			}
			
			//Set up animation
			this.animate("ent_construct");
			
			//Basic properties
			this.collisionWidth = this.width;
			this.collisionHeight = this.height;
			this.collisionOffsetX = 0;
			this.collisionOffsetY = 0;
			
			for(var p in this.behaviourData) {
				this._handleSpecialEProp(p, this.behaviourData[p]);
			}
			
			//Behaviours
			if(entities.types.isValidType(type)) {
				var beh = entities.types.getAll(type).behaviours;
				for(var b in beh) {
					if(beh[b]) this.addBehaviour(b, true);
				}
			}
			
			//And fire event
			this.behaviourFire("typeChange");
		}
	});
	
	
	
	//Velocity
	/** Removes all dx speed from the entity.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.killDx = function() {
		this._dxAccum = {};
	};
	
	/** Removes all dy speed from the entity.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.killDy = function() {
		this._dyAccum = {};
	};
	
	/** Takes the output from "verForce" or "horForce" manages acceleration and returns the new dx or dy.
	 * @param {array} arr The output of the event.
	 * @param {integer} base The initial dx or dy.
	 * @param {object} accum The dyAccum or dxAccum object.
	 * @param {boolean} lowCollide Whether there is a collision on the left or top.
	 * @param {boolean} highCollide Whether there is a collision on the right or bottom.
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _sum = function(arr, base, accum, lowCollide, highCollide) {
		var out = 0;
		var vels = 0;
		
		var pa = 0;
		var na = 0;
		
		// Accumuluate positive forces
		// Total sum
		var psum = 0;
		// Array of positive forces
		var pforces = [];
		
		var pvels = [];
		var pvelsum = 0;
		
		// And negative ones
		var nsum = 0;
		var nforces = [];
		var nvels = [];
		var nvelsum = 0;
		
		// First of all, loop through all the supplied velocities and update their accumulators, put them in the
		// pforces or nforces array, and add them to the sum and velsum counters
		for(var i = 0; i < arr.length; i ++) {
			if(arr[i] && Array.isArray(arr[i])) {
				if(!(arr[i][2] in accum)) {
					accum[arr[i][2]] = 0;
				}
				
				vels ++;
				if(arr[i][0] > 0) {
					psum += arr[i][0];
					pforces.push(arr[i]);
				}else if(arr[i][0] < 0) {
					nsum -= arr[i][0];
					nforces.push(arr[i]);
				}
				
				if(accum[arr[i][2]] > 0) {
					pvelsum += accum[arr[i][2]];
					pvels.push(arr[i]);
				}else if(accum[arr[i][2]] < 0) {
					nvelsum -= accum[arr[i][2]];
					nvels.push(arr[i]);
				}
			} 
		}
		
		// Friction, apply a force to oppose the movement
		if(base > 0) nsum -= 0.05;
		if(base < 0) psum += 0.05;
		
		var pleft = psum;
		var nleft = nsum;
		
		// Check collisions and remove accumulated speed if there is a collision
		if(lowCollide) {
			for(var i = 0; i < nvels.length; i ++) {
				if(accum[nvels[i][2]] < 0) accum[nvels[i][2]] = 0;
			}
		}
		if(highCollide) {
			for(var i = 0; i < pvels.length; i ++) {
				if(accum[pvels[i][2]] > 0) accum[pvels[i][2]] = 0;
			}
		}
		
		// Reduce the velerations by the forces opposing them
		for(var i = 0; i < nvels.length; i ++) {
			var pleftFrag = (-accum[nvels[i][2]] / nvelsum) * pleft;
			
			if(-accum[nvels[i][2]] > pleftFrag) {
				accum[nvels[i][2]] += pleftFrag;
				pleft -= pleftFrag;
			}else{
				accum[nvels[i][2]] = 0;
				pleft += accum[nvels[i][2]];
			}
		}
		
		for(var i = 0; i < pvels.length; i ++) {
			var nleftFrag = (accum[pvels[i][2]] / pvelsum) * nleft;
			
			if(accum[pvels[i][2]] > nleftFrag) {
				accum[pvels[i][2]] -= nleftFrag;
				nleft -= nleftFrag;
			}else{
				accum[pvels[i][2]] = 0;
				nleft -= accum[pvels[i][2]];
			}
		}
		
		// Then divy up the remaining force
		if(pleft) {
			for(var i = 0; i < pforces.length; i ++) {
				accum[pforces[i][2]] += pleft * (pforces[i][0] / psum);
				
				if(accum[pforces[i][2]] < -pforces[i][1]) accum[pforces[i][2]] = -pforces[i][1];
				if(accum[pforces[i][2]] > pforces[i][1]) accum[pforces[i][2]] = pforces[i][1];
			}
		}
		if(nleft) {
			for(var i = 0; i < nforces.length; i ++) {
				accum[nforces[i][2]] += nleft * (nforces[i][0] / nsum);
				
				if(accum[nforces[i][2]] < -nforces[i][1]) accum[nforces[i][2]] = -nforces[i][1];
				if(accum[nforces[i][2]] > nforces[i][1]) accum[nforces[i][2]] = nforces[i][1];
			}
		}
		
		// And generate final velocity
		var out = 0;
		for(var i = 0; i < arr.length; i ++) {
			if(arr[i]) {
				if(Array.isArray(arr[i])) {
					out += accum[arr[i][2]];
				}else{
					out += arr[i];
				}
			} 
		}
		
		return out;
	};
	
	/** Called before all entities are moved by `{@link dusk.entities.sgui.EntityGroup}`, and causes all the 
	 *  speeds of this entity to accelerate or decelerate if needed.
	 * 
	 * This also resets the touchers, so it should be called before collisions are checked.
	 * 
	 * It also fires a `beforeMove` behaviour event with an empty event object.
	 */
	Entity.prototype.beforeMove = function() {
		// Apply forces
		
		// Listeners
		var dys = this.behaviourFireWithReturn("verForce");
		dys = this.behaviourFireWithPass("affectVerForce", {"forces":dys}).forces;
		this.dy = _sum(
			dys, this.dy, this._dyAccum, this.touchers(c.DIR_UP).length > 0, this.touchers(c.DIR_DOWN).length > 0
		);
		
		var dxs = this.behaviourFireWithReturn("horForce");
		dxs = this.behaviourFireWithPass("affectHorForce", {"forces":dxs}).forces;
		this.dx = _sum(
			dxs, this.dx, this._dxAccum, this.touchers(c.DIR_LEFT).length > 0, this.touchers(c.DIR_RIGHT).length > 0
		);
		
		// Fire the modifier events
		var out = this.behaviourFireWithPass("speedMod", {"dx":this.dx, "dy":this.dy});
		this.dy = out.dy;
		this.dx = out.dx;
		
		//Clear touchers
		this._touchers[c.DIR_UP] = [];
		this._touchers[c.DIR_DOWN] = [];
		this._touchers[c.DIR_LEFT] = [];
		this._touchers[c.DIR_RIGHT] = [];
		this._touchersNonSolid[c.DIR_UP] = [];
		this._touchersNonSolid[c.DIR_DOWN] = [];
		this._touchersNonSolid[c.DIR_LEFT] = [];
		this._touchersNonSolid[c.DIR_RIGHT] = [];
		
		//Accelerate or decelerate
		/*for(var p in this._dx) {
			if(this._dx[p][1] == 0) {
				delete this._dx[p];
			}else{
				if(this._dx[p][1] > 0) this._dx[p][1] --;
				this._dx[p][0] += this._dx[p][2];
				if(this._dx[p][3] != undefined && this._dx[p][2] < 0 && this._dx[p][0] < this._dx[p][3])
					this._dx[p][0] = this._dx[p][3];
				if(this._dx[p][3] != undefined && this._dx[p][2] > 0 && this._dx[p][0] > this._dx[p][3])
					this._dx[p][0] = this._dx[p][3];
			}
		}
		
		for(var p in this._dy) {
			if(this._dy[p][1] == 0) {
				delete this._dy[p];
			}else{
				if(this._dy[p][1] > 0) this._dy[p][1] --;
				this._dy[p][0] += this._dy[p][2];
				if(this._dy[p][3] != undefined && this._dy[p][2] < 0 && this._dy[p][0] < this._dy[p][3])
					this._dy[p][0] = this._dy[p][3];
				if(this._dy[p][3] != undefined && this._dy[p][2] > 0 && this._dy[p][0] > this._dy[p][3])
					this._dy[p][0] = this._dy[p][3];
			}
		}
		
		//Timeout mults
		for(var p in this._dxMults) {
			if(this._dxMults[p][1] == 0) {
				delete this._dxMults[p];
			}else{
				if(this._dxMults[p][1] > 0) this._dxMults[p][1] --;
			}
		}
		
		for(var p in this._dyMults) {
			if(this._dyMults[p][1] == 0) {
				delete this._dyMults[p];
			}else{
				if(this._dyMults[p][1] > 0) this._dyMults[p][1] --;
			}
		}*/
		
		//Fire beforeMove event
		this.behaviourFire("beforeMove");
	};
	
	
	//Behaviours
	/** Fires a behaviour event to all of the behaviours on this entity.
	 * @param {string} event The name of the event, will be set as the `name` property on the event
	 *  data.
	 * @param {object={}} data The event data.
	 */
	Entity.prototype.behaviourFire = function(event, data) {
		if(!data) data = {};
		data.name = event;
		
		this.entityEvent.fire(data, event);
		
		var keys = Object.keys(this._behaviours);
		for(var b = keys.length-1; b >= 0; b --) {
			this._behaviours[keys[b]].entityEvent.fire(data, event);
		}
		
		if(event in this._behaviourListeners) {
			for(var i = 0; i < this._behaviourListeners[event].length; i ++) {
				this._behaviourListeners[event][i].call(window, this, data, event);
			}
		}
	};
	
	/** Fires a behaviour event to all of the behaviours on this entity.
	 * 
	 * This returns an array of the return values of all events.
	 * @param {string} event The name of the event, will be set as the `name` property on the event
	 *  data.
	 * @param {object={}} data The event data.
	 * @return {array} An array of all the return values of the functions.
	 */
	Entity.prototype.behaviourFireWithReturn = function(event, data) {
		var output = [];
		if(!data) data = {};
		data.name = event;
		
		output[0] = this.entityEvent.fireOne(data, event);
		
		var keys = Object.keys(this._behaviours);
		for(var b = keys.length-1; b >= 0; b --) {
			output.push(this._behaviours[keys[b]].entityEvent.fireOne(data, event));
		}
		
		if(event in this._behaviourListeners) {
			for(var i = 0; i < this._behaviourListeners[event].length; i ++) {
				output.push(this._behaviourListeners[event][i].call(window, this, data, event));
			}
		}
		
		return output;
	};
	
	/** Fires a behaviour event to all of the behaviours on this entity.
	 * 
	 * This returns the event object, which will be passed through all events.
	 * @param {string} event The name of the event, will be set as the `name` property on the event
	 *  data.
	 * @param {object={}} data The event data.
	 * @return {object} The event data.
	 */
	Entity.prototype.behaviourFireWithPass = function(event, data) {
		if(!data) data = {};
		data.name = event;
		
		data = this.entityEvent.firePass(data, event);
		
		var keys = Object.keys(this._behaviours);
		for(var b = keys.length-1; b >= 0; b --) {
			data = this._behaviours[keys[b]].entityEvent.firePass(data, event);
		}
		
		if(event in this._behaviourListeners) {
			for(var i = 0; i < this._behaviourListeners[event].length; i ++) {
				data = this._behaviourListeners[event][i].call(window, this, data, event);
			}
		}
		
		return data;
	};
	
	/** Adds a new behaviour to this entity.
	 * @param {string} name The name of the behaviour to add.
	 * @param {boolean=false} reInit If the behaviour already exists and this is true, it will be
	 *  deleted and recreated, else nothing happens.
	 * @return {?dusk.entities.behave.Behave} The behaviour that was added, or null if it wasn't added.
	 */
	Entity.prototype.addBehaviour = function(name, reInit) {
		if(name in this._behaviours && !reInit) return null;
		if(!entities.getBehaviour(name)) {
			console.error("Behaviour "+name+" does not exist for "+this.entType);
			return;
		}
		
		if(typeof entities.getBehaviour(name) == "function") {
			this._behaviours[name] = new (entities.getBehaviour(name))(this);
		}else{
			//Classless behaviour
			var beh = entities.getBehaviour(name);
			
			for(var p in beh) {
				if(typeof beh[p] == "function") {
					if(!this._behaviourListeners[p]) this._behaviourListeners[p] = [];
					this._behaviourListeners[p].push(beh[p]);
				}else{
					this.eProp(p, beh[p], true);
				}
			}
		}
	};
	
	/** Returns a behaviour from this entity.
	 * @param {string} name The name of the behaviour to get.
	 * @return {?dusk.entities.behave.Behave} The behaviour that was added, or null if it hasn't got it.
	 */
	Entity.prototype.getBehaviour = function(name) {
		if(!(name in this._behaviours)) return null;
		
		return this._behaviours[name];
	};
	
	/** Sets an entity data property to the value, or returns it if no value is specified.
	 * @param {string} prop The name of the property to set or get.
	 * @param {?*} set The value to set the property, if no value is provided, then nothing will be set.
	 * @param {?boolean} init If true, the value will ONLY be set if it has not already been set.
	 * @return {*} The value of the specified property.
	 */
	Entity.prototype.eProp = function(prop, set, init) {
		if(set !== undefined && (!init || !(prop in this.behaviourData))) {
			this._handleSpecialEProp(prop, set);
			this.behaviourData[prop] = set;
			return set;
		}
		
		if(this.behaviourData && prop in this.behaviourData) {
			return this.behaviourData[prop];
		}
	};
	
	/** Given a key and value, handles special entity properties, like those to set collisionOffsets and image srcs.
	 * 
	 * If the key isn't a special type, this does nothing.
	 * 
	 * @param {string} key The key of the special property.
	 * @param {*} * The value that has been set.
	 * @private
	 */
	Entity.prototype._handleSpecialEProp = function(key, value) {
		switch(key) {
			case "src":
			case "collisionWidth":
			case "collisionHeight":
			case "collisionOffsetX":
			case "collisionOffsetY":
				this[key] = value;
				break;
			
			case "animationRate":
				this.getExtra("animation").rate = value;
				break;
		}
	};
	
	/** Returns true if the specified control is active.
	 * 
	 * Other behaviours should listen for the "controlActive" event. The event object will have the property "control",
	 *  and the listeners are expected to return `true` if the control is "activated". This method will return true if
	 *  one of the listeners returns true.
	 * 
	 * If the control is in a behaviour property array `controlsOn`, this will always return true, as well.
	 * 
	 * @param {string} name The name of the control to check.
	 * @return {boolean} Whether the control is activated or not.
	 */
	Entity.prototype.controlActive = function(name) {
		if(this.eProp("controlsOn") && this.eProp("controlsOn").indexOf(name) !== -1) {
			return true;
		}
		
		if(this.behaviourFireWithReturn("controlActive", {"control":name}).indexOf(true) !== -1) {
			return true;
		}
		
		return false;
	};
	
	
	
	//Animation
	/** Called when a frame is ran. It fires the `frame` entity event, calls the animation funciton, and
	 * decrements all cooldowns.
	 */
	Entity.prototype.startFrame = function(active) {
		this.behaviourFire("frame", {"active":active});
	};
	
	Entity.prototype.animate = function(name) {
		return this.getExtra("animation").changeAnimation(name);
	};
	
	//Triggers
	/** Alias to `{@link dusk.entities.sgui.Entity#evalTrigger}`.
	 * @param {*} trigger The trigger.
	 * @param {?string} event The name of the event, if appropriate.
	 * @return {*} The result of the evaluated parse tree.
	 * @depreciated
	 */
	Entity.prototype.meetsTrigger = function(trigger) {
		return this.evalTrigger(trigger);
	};

	/** Using the parse tree described in the class docs, will evaluate it, and return the value.
	 * 
	 * If the trigger isn't a string, it is returned exactly, if it is an empty string, true is
	 *  returned.
	 * @param {*} trigger The trigger.
	 * @param {?string} event The name of the event, if appropriate.
	 * @return {*} The result of the evaluated parse tree.
	 */
	Entity.prototype.evalTrigger = function(trigger) {
		if(typeof trigger != "string") return trigger;
		if(trigger.trim() == "") return true;
		
		//var t = performance.now();
		var e = _triggerTree.compile(trigger).eval({"ent":this});
		//var ta = performance.now() - t;
		//t = performance.now();
		////var f = this._triggerTree.compileToFunct(trigger)();
		//var tb = performance.now() - t;
		//console.log(ta + " vs " + tb);
		
		return e;
	};
	
	/** The parse tree used for evaluating triggers.
	 * @type dusk.utils.parseTree
	 * @private
	 */
	var _triggerTree = new parseTree.Compiler([], [
		["#", function(o, v, ctx) {
				switch(v) {
					case "dx": return ctx.ent.dx;
					case "dy": return ctx.ent.dy;
					case "tb": return ctx.ent.touchers(c.DIR_DOWN).length;
					case "tu": return ctx.ent.touchers(c.DIR_UP).length;
					case "tl": return ctx.ent.touchers(c.DIR_LEFT).length;
					case "tr": return ctx.ent.touchers(c.DIR_RIGHT).length;
					case "path": return ctx.ent.fullPath();
					case "edit": return editor && editor.active;
					default: return "#"+v;
				}
			}, false
		],
		[".", function(o, v, c) {
				return c.ent.prop(v);
			}, false],
		[":", function(o, v, c) {return c.ent.eProp(v);}, false],
		["stat", function(o, v, c) {return c.ent.stats?c.ent.stats.get(v[0], v[1]):undefined;}, false],
		["stati", function(o, v, c) {return c.ent.stats?c.ent.stats.geti(v[0], v[1]):undefined;}, false],
	], []);
	
	
	//Touchers
	/** Returns an array of either `Entity` instances or the string `"wall"` which are touching this entity on the
	 *  specified side.
	 * @param {integer} dir The specified direction, one of the `dusk.sgui.c.DIR_*` constants.
	 * @return {array} The things touching this entity on the specified side.
	 */
	Entity.prototype.touchers = function(dir) {
		if(!(dir in this._touchers)) {console.warn("Unknown dir "+dir+" for touching!"); return [];}
		return this._touchers[dir];
	};
	
	/** Returns an array of either `Entity` instances or the string `"wall"` which are touching this entity on any side.
	 * @return {array} The things touching this entity.
	 */
	Entity.prototype.allTouchers = function() {
		var out = [];
		
		out = this.touchers(c.DIR_UP);
		out = utils.arrayUnion(out, this.touchers(c.DIR_DOWN));
		out = utils.arrayUnion(out, this.touchers(c.DIR_LEFT));
		out = utils.arrayUnion(out, this.touchers(c.DIR_RIGHT));
		
		return out;
	};
	
	/** Returns an array of either `Entity` instances or the string `"wall"` which are touching this entity on the
	 *  specified side, including entities which are not solid.
	 * @param {integer} dir The specified direction, one of the `dusk.sgui.c.DIR_*` constants.
	 * @return {array} The things touching this entity on the specified side.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.touchersNonSolid = function(dir) {
		if(!(dir in this._touchersNonSolid)) {console.warn("Unknown dir "+dir+" for touching!"); return [];}
		return this._touchersNonSolid[dir];
	};
	
	/** Returns an array of either `Entity` instances or the string `"wall"` which are touching this entity on any side,
	 *  even if they are not solid.
	 * @return {array} The things touching this entity.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.allTouchersNonSolid = function() {
		var out = [];
		
		out = this.touchersNonSolid(c.DIR_UP);
		out = utils.arrayUnion(out, this.touchersNonSolid(c.DIR_DOWN));
		out = utils.arrayUnion(out, this.touchersNonSolid(c.DIR_LEFT));
		out = utils.arrayUnion(out, this.touchersNonSolid(c.DIR_RIGHT));
		
		return out;
	};
	
	/** Called by `{@link dusk.entities.sgui.EntityGroup}` to indicate that the specified entity is touching it.
	 * @param {integer} dir The side it is touching this, one of the `dusk.sgui.c.DIR_*` constants.
	 * @param {dusk.entities.sgui.Entity|string} entity The entity touching this, or the string `"wall"`.
	 */
	Entity.prototype.addToucher = function(dir, entity) {
		if(entity === "wall" || entity.eProp("solid")) this._touchers[dir].push(entity);
		this._touchersNonSolid[dir].push(entity);
	};
	
	
	// Fluid
	/** Returns 0 if the entity is above the fluid level completely, 1 if it is below the fluid level, and a value
	 *  between 0 and 1 proportional to how much of the entity is below the fluid level.
	 * @return {float} How under the fluid this entity is.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.underFluid = function(offset) {
		if(!this.fluid) return 0.0;
		if(offset === undefined) offset = 0;
		
		var start = this.fluid.start();
		if(start == -1) return 0.0;
		
		if(this.y + this.height + offset - start < 0) return 0.0;
		if(this.y + this.height + offset - start > this.height) return 1.0;
		return (this.y + this.height + offset - start) / this.height;
	};
	
	
	
	//Misc
	/** Registered with the draw handler to draw a rectangle around this entity's hitbox.
	 * @param {object} e An event from `{@link dusk.sgui.Component#onPaint}`.
	 */
	Entity.prototype._collisionPaint = function(e) {
		e.c.strokeStyle = this.collisionMark;
		e.c.lineWidth = 1;
		e.c.strokeRect(
			e.d.dest.x + this.collisionOffsetX, e.d.dest.y + this.collisionOffsetY, 
			this.collisionWidth - this.collisionOffsetX, this.collisionHeight - this.collisionOffsetY
		);
	};
	
	/** This terminates the entity, which is a way to "gracefully delete" it. First, a behaviour event
	 *  `terminate` is fired, if none of the listeners to that return true, 
	 *  `{@link dusk.entities.sgui.Entity#animationWait}` is called with a `terminate` event with the callback 
	 *  deleting this element.
	 * 
	 * This should be used if you want the entity to animate it's death, otherwise, if you just want it
	 *  gone without any effects, set it's `{@link dusk.sgui.Component#deleted}` property to true.
	 * @return {promise()} A promise that fulfills when the entity is deleted.
	 */
	Entity.prototype.terminate = function() {
		return new Promise((function(f, r) {
			if(!this.behaviourFireWithReturn("terminate", {}).includes(true)) {
				this.animate("ent_terminate").then((function() {
					this.eProp("terminated", true);
					this.terminated = true;
					this.deleted = true;
					f(true);
				}).bind(this));
			}
		}).bind(this));
	};
	
	sgui.registerType("Entity", Entity);
	return Entity;
})());
