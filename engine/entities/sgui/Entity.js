//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.sgui.Entity", (function() {
	var Tile = load.require("dusk.tiles.sgui.Tile");
	var utils = load.require("dusk.utils");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require("dusk.sgui");
	var interaction = load.require("dusk.input.interaction");
	var editor = load.suggest("dusk.rooms.editor", function(p){editor = p;});
	var AnimatedTile = load.require("dusk.tiles.sgui.extras.AnimatedTile");
	var functionStore = load.require("dusk.utils.functionStore");
	
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
	 * An entity may be attached to at most one other entity. In this case, this entity will always ensure that it is
	 *  in the same location as the "parent".
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
	 * - `width`,`height`,`attachOffsetX`,`attachOffsetY`: Likewise.
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
	 * - `collide`: Fired by `dusk.entities.sgui.EntityGroup` when this entity collides into another entity or a wall.
	 *  The event object has two properties; `dir` a dusk.sgui.c.DIR_* constant representing the side that collided, and
	 *  `target`, the entity that it collided into, or the string `"wall"`.
	 * - `collidedInto`: Fired by `dusk.entities.sgui.EntityGroup` when this is collided into by another entity. The
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
	 * - `attach`: Fired when an entity is attached to this. The event object has `child`, which is the new child.
	 * - `becomeAttached`: Fired when this entity is attached to another one. The event object has a `parent` property
	 *  which is the entity this is attached to.
	 * - `detach`, `becomeDetached`: Fired when an entity is detached or this is detached from an entity. Same event
	 *  object properties as their attach events.
	 * - `attachPaprentDie`: Fired when the parent that this entity is attached to is deleted. The `becomeDetached`
	 *  event will NOT fire in this case. The event object has a `parent` property.
	 * 
	 * The events go in the order every frame: `verForce`, `affectVerForce`, `horForce`, `affectHorForce`, `beforeMove`,
	 *  any collision events, `frame`.
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
		/** The entity's behaviour data. This is data used by the entity's behaviour objects. It contains stuff such as
		 * gravity. This is set with the entity's type.
		 * @type object
		 * @private
		 */
		this._behaviourData = {};
		/** The entity's behaviour state, this contains the value of changed entity types.
		 * @type Map<string, *>
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._behaviourState = new Map();
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
		
		/** The parent this is attached to, or null if it doesn't exist.
		 * 
		 * Please do not set this to attach a child, use `attach` and `detach` instead.
		 * @type dusk.entities.sgui.Entity
		 * @since 0.0.21-alpha
		 */
		this.attachParent = null;
		/** An array of all the children attached to this entity.
		 * @type array<dusk.entities.sgui.Entity>
		 * @since 0.0.21-alpha
		 * @private
		 */
		this._attachChildren = [];
		
		/** Added to the x value of the attached parent (if it exists) to get this entity's x location.
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.attachOffsetX = 0;
		/** Added to the y value of the attached parent (if it exists) to get this entity's y location.
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.attachOffestY = 0;
		
		/** Use this to check if the entity is terminated or not, this is set to true by
		 *  `{@link dusk.entities.sgui.Entity#terminate}`, and means the entity is set for deleting when an
		 *  animation is finished. Please do not set this property directly.
		 * @type boolean
		 */
		this.terminated = false;
		
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
			for(var c of this._attachChildren) {
				c.behaviourFire("attachParentDie", {"parent":this});
				c.attachParent = null;
			}
			
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
				this._behaviourData = entities.types.getAll(type).data;
				this.getExtra("animation").setAnimations(utils.copy(entities.types.getAll(type).animation, true));
			}else{
				this._behaviourData = {"headingLeft":false, "headingUp":false, "img":"nosuchimage.png",
					"solid":true, "collides":true
				};
			}
			
			//Set up animation
			this.animate("ent_construct");
			
			//Basic properties
			this.collisionWidth = -1;
			this.collisionHeight = -1;
			this.collisionOffsetX = 0;
			this.collisionOffsetY = 0;
			
			for(var p in this._behaviourData) {
				this._handleSpecialEProp(p, this._behaviourData[p]);
			}
			if(this.collisionWidth < 0) this.collisionWidth = this.width;
			if(this.collisionHeight < 0) this.collisionHeight = this.height;
			
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
	 * 
	 * The algorithm works as follows:
	 * - For each force from the event:
	 * -- Store the positive and negative accelerations into psum and nsum
	 * -- Store the sum of the accumulated speeds into pvelsum and nvelsum
	 * - With the new accelerations, reduce them a bit because of friction. This can make them negative.
	 * - If we have collided, remove all accumulated speeds heading towards the wall.
	 * - 
	 * 
	 * 
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
		for(var force of arr) {
			if(force && Array.isArray(force)) {
				var name = force[2];
				
				// No entry? Add it
				if(!(name in accum)) {
					accum[name] = 0;
				}
				
				if(force[0] > 0) {
					psum += force[0];
					pforces.push(force);
				}else if(force[0] < 0) {
					nsum -= force[0];
					nforces.push(force);
				}
				
				if(accum[name] > 0) {
					pvelsum += accum[name];
					pvels.push(force);
				}else if(accum[name] < 0) {
					nvelsum -= accum[name];
					nvels.push(force);
				}
			} 
		}
		
		// Friction, apply a force to oppose the movement
		if(base > 0) nsum += 0.05;
		if(base < 0) psum += 0.05;
		
		// BOTH OF THESE ARE POSITIVE
		var pleft = psum;
		var nleft = nsum;
		
		// Check collisions and remove accumulated speed if there is a collision
		if(lowCollide) {
			for(var i = 0; i < nvels.length; i ++) {
				accum[nvels[i][2]] = 0;
			}
		}
		if(highCollide) {
			for(var i = 0; i < pvels.length; i ++) {
				accum[pvels[i][2]] = 0;
			}
		}
		
		// Reduce the accumulated speeds by their opposing forces
		// The speeds are divided up such that larger accumulated speeds get a larger fraction of the force to decay
		// them.
		// The left values are burned by using them to oppose accumulated forces
		for(var i = 0; i < nvels.length; i ++) {
			var pleftShare = (-accum[nvels[i][2]] / nvelsum) * pleft;
			
			if(-accum[nvels[i][2]] > pleftShare) {
				accum[nvels[i][2]] += pleftShare;
				pleft -= pleftShare;
			}else{
				accum[nvels[i][2]] = 0;
				pleft -= accum[nvels[i][2]];
			}
		}
		
		for(var i = 0; i < pvels.length; i ++) {
			var nleftShare = (accum[pvels[i][2]] / pvelsum) * nleft;
			
			if(accum[pvels[i][2]] > nleftShare) {
				accum[pvels[i][2]] -= nleftShare;
				nleft -= nleftShare;
			}else{
				accum[pvels[i][2]] = 0;
				nleft -= accum[pvels[i][2]];
			}
		}
		
		if(pleft < nleft) {
			nleft -= pleft;
			pleft = 0;
		}else if(pleft > nleft) {
			pleft -= nleft;
			nleft = 0;
		}

		//if(pleft < 0.1) pleft = 0;
		//if(nleft < 0.1) nleft = 0;

		// Then with the remaining force, add them to their accumulated speeds
		// Again, based on the original fraction
		if(pleft) {
			for(var i = 0; i < pforces.length; i ++) {
				accum[pforces[i][2]] += pleft * (pforces[i][0] / psum);
				
				// Limit check
				if(accum[pforces[i][2]] < -pforces[i][1]) accum[pforces[i][2]] = -pforces[i][1];
				if(accum[pforces[i][2]] > pforces[i][1]) accum[pforces[i][2]] = pforces[i][1];
			}
		}
		if(nleft) {
			for(var i = 0; i < nforces.length; i ++) {
				accum[nforces[i][2]] += nleft * (nforces[i][0] / nsum); // nforces[i][0] is negative
				
				// Limit check
				if(accum[nforces[i][2]] < -nforces[i][1]) accum[nforces[i][2]] = -nforces[i][1];
				if(accum[nforces[i][2]] > nforces[i][1]) accum[nforces[i][2]] = nforces[i][1];
			}
		}
		
		// And generate final velocity by simply adding them together
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
		if(set !== undefined && (!init || (!(prop in this._behaviourData) && !this._behaviourState.has(prop)))) {
			this._handleSpecialEProp(prop, set);
			this._behaviourState.set(prop, set);
			return set;
		}
		
		if(this._behaviourState.has(prop)) {
			return this._behaviourState.get(prop);
		}
		
		if(this._behaviourData && prop in this._behaviourData) {
			return this._behaviourData[prop];
		}
	};
	
	/** Gets an object representing the behaviour state, this will be an object with all the values that have been
	 * changed by setting entity properties.
	 * 
	 * @return {object} The entity state.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.getState = function() {
		var out = {};
		
		for(var d of this._behaviourState) {
			out[d[0]] = d[1];
		}
		
		return out;
	};
	
	/** Given an object, reads all the keys from it and set the entity property for it to the appropriate value.
	 * 
	 * @param {object} state The entity state to read properties from.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.setState = function(state) {
		for(var p in state) {
			this.eProp(p, state[p]);
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
			case "attachOffsetX":
			case "attachOffsetY":
			case "width":
			case "height":
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
		// If we are attached to something, update our location
		if(this.attachParent) {
			this.x = this.attachParent.x + this.attachOffsetX;
			this.y = this.attachParent.y + this.attachOffsetY;
		}
		
		this.behaviourFire("frame", {"active":active});
	};
	
	Entity.prototype.animate = function(name) {
		return this.getExtra("animation").changeAnimation(name);
	};
	
	
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
	
	// Attaching
	/** Attaches the given entity to this entity.
	 * @param {dusk.entities.sgui.Entity} entity The entity to attach.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.attach = function(entity) {
		entity.attachParent = this;
		this._attachChildren.push(entity);
		this.behaviourFire("attach", {"child":entity});
		entity.behaviourFire("becomeAttached", {"parent":this});
	};
	
	/** Detaches a given entity from this one, if it is attached.
	 * @param {dusk.entities.sgui.Entity} entity The entity to remove.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.detach = function(entity) {
		var i = this._attachChildren.indexOf(entity);
		if(i >= 0) {
			this.behaviourFire("detach", {"child":entity});
			entity.behaviourFire("becomeDetached", {"parent":this});
			entity.attachParent = null;
			this._attachChildren.splice(i, 1);
		}
	};
	
	/** Returns all the children attached to this entity.
	 * @reutrn {array<dusk.entities.sgui.Entity} entity The children attached to this entity.
	 * @since 0.0.21-alpha
	 */
	Entity.prototype.getAttached = function() {
		return this._attachChildren;
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
	 * `terminating` is fired, and the "terminated" proprety is set to 1. Then the animation "ent_terminate" is run.
	 * When that completes, "terminated" is set to 2 and the "terminated" event is fired.
	 * 
	 * This should be used if you want the entity to animate its death, otherwise, if you just want it
	 *  gone without any effects, set it's `deleted` property to true.
	 * @return {promise()} A promise that fulfills when the entity is deleted.
	 */
	Entity.prototype.terminate = function() {
		return new Promise((function(f, r) {
			this.eProp("terminated", 1);
			this.behaviourFire("terminating", {});
			if(!this.behaviourFireWithReturn("terminate", {}).includes(true)) {
				this.animate("ent_terminate").then((function() {
					this.eProp("terminated", 2);
					this.behaviourFire("terminated", {});
					this.terminated = true;
					this.deleted = true;
					f(true);
				}).bind(this));
			}
		}).bind(this));
	};
	
	sgui.registerType("Entity", Entity);
	
	// Stored functions
	functionStore.register("entity-eprop", function(p, e) {return e.eProp(p);});
	
	return Entity;
})());
