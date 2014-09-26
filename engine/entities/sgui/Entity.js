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
	
	/** An entity is a component that has "behaviours" and can do certain activites, possibly in response to another
	 *  entity or user input.
	 * 
	 * It is a normal tile with a movement system, an animation system, a collision system and a behaviour system added
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
	 * The animation system works based on choosing the highest priority animation and using it, unless it is no lorger
	 *  applicable or a higher priority animation needs to be run. The entity's type determines the animations it
	 *  performs. In the entity's type data there is an `animation` key, which is an array of arrays.
	 * 
	 * Each array in this data is a single animation, the last one in the array that can be used will be the one that is
	 *  used. The first element is a trigger critera such that `evalTrigger` is true if and only if the animation should
	 *  run. The second is a string with "animation actions" as described below seperated by a "|" character. The third
	 *  element is an option which describes additional flags and settings for the animation.
	 * 
	 * The animation starts at the first animation frame, and then every `frameDelay` frames, it will move onto the next
	 *  one, and execute it. Some animation events cause the next one to be executed immediatley.
	 * 
	 * The animation actions are determined by the first character in the string, as follows:
	 * 
	 * - `$var=value`: Sets an animation variable to the specified value. This can be used for evaling
	 *  triggers using the `$` operator.
	 * - `+time`: Waits `time` frames before moving onto the next action.
	 * - `?trigger?yes?no`: Evaluates the trigger and skips forward `yes` actions if it is true, and `no` actions if it
	 *  is false, and executes that action.
	 * - `>animation`: Switches the current animation to the one with the name `animation`, and executes the first
	 *  action.
	 * - `!event`: Fires the behaviour event `event` and then moves onto the next animation action and executes it.
	 * - `/event`: If this animation event is blocking some other event `event`, then this will terminate that event,
	 *  and cause the block to be removed. This also releases a lock.
	 * - `\event`: Same as `/event` but does not release the lock.
	 * - `*pname data`: Does the particle effect named `pname` with the data `data`. Data should be a 
	 *  json string, and each of it's keys will be fed through `{@link dusk.entities.sgui.Entity#evalTrigger}`.
	 *  The next event is executed.
	 * - `L`: Locks the current animation, so it can't change until the lock is released, and then move onto and execute
	 *  the next animation action.
	 * - `l`: Removes any lock, and then move onto and execute the next action.
	 * - `x,y`: Where x and y are integers, sets the current tile to the tile specified.
	 * - `#+trans;`: Adds the transformation `trans` to this entity's image, replacing it if it already exists.
	 * - `#-trans;`: Removes the transformation `trans` from this entity's image.
	 * 
	 * The third element has the following possible keys:
	 * 
	 * - `name`: a string; the name of the animation, for use with the `>` event.
	 * - `suppressSmooth`: a boolean; if false or ommited, then if the entity's current frame is anywhere in this
	 *  animation's action list, then it will be skipped to. 
	 * 
	 * A particle effects system is also provided, which works on almost the same way as the animation system. In the
	 *  entity's data, there is also a "particles" property, which has the same format.
	 * 
	 * The difference is that only one animation can run at a time, yet more than one particle effect can also run.
	 *  Also, while animations step through their action, particle effects run them all at once. The same animation
	 *  events are used for particle effects, although only `$`, `*` and `t` should be used.
	 * 
	 * Additional "third element properties" can be set on particle effects:
	 * 
	 * - `onlyOnce`: A boolean; if true, then the effect will run only after if it's criteria has been false between the
	 *  last time it ran and now.
	 * - `cooldown`: An integer; the time in frames the effect must wait until it is ran again.
	 * 
	 * Due to the nature of animations, at least one of `onlyOnce` or `cooldown` must be specified, as the function that
	 *  resolves animations may be called more than once a frame.
	 * 
	 * Entities can collide with each other, if they are in a `dusk.entities.sgui.EntityGroup`. The collision hit box is a
	 *  rectangle from the coordinates (`x+collisionOffestX`, `y+collisionOffestY`) to (`x+collisionWidth`,
	 *  `y+collisionHeight`). The function `touchers` can be used to get a list of components touching this one on the
	 *  specified side.
	 * 
	 * Entities can have behaviours on them. Behaviours available are as an object on the `behaviours` property of the
	 *  entity type description. Each key of this object is the name of a behaviour, while the value is a boolean for
	 *  whether the entity should have this behaviour.
	 * 
	 * Behaviours are subclasses of `Behave`, and must be registered using 
	 *  `dusk.entities.registerBehaviour` before they can be used. Entity behaviours share an object `behaviourData`
	 *  which is used for storing and retrieving values, and can be accessed using `eProp` or
	 *  `dusk.entities.behave.Behave._data`. By convention, the keys are of the form `"behaviourName:varName"` or
	 *  `"_behaviourName:_privateVarName"`.
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
	 * - `$var`: The value of the animation variable `var`.
	 * - `.var`: The value of the component property `var`.
	 * - `:var`: The value of the entity data property `var`.
	 * 
	 * @extends dusk.tiles.sgui.Tile
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @constructor
	 */
	var Entity = function(parent, comName) {
		if(!this.isLight()) Tile.call(this, parent, comName);
		
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
		
		/** The animation data for the entity, in the same format as described in the entity type
		 *  description. For speed, the second element of the value will be sliced once, and so will be
		 *  an array after the first time it is used.
		 * @type array
		 * @private
		 */
		this._animationData = [];
		/** The index of the currently running animation.
		 * @type integer
		 * @private
		 */
		this._currentAni = 0;
		/** The index of the current frame in the current animation.
		 * @type integer
		 * @private
		 */
		this._aniPointer = 0;
		/** Whether the current animation is locked or not.
		 * @type boolean
		 * @private
		 */
		this._aniLock = false;
		/** Animation variables. Key is var name, value is var value.
		 * @type object
		 * @private
		 */
		this._aniVars = {};
		/** The functions set by `{@link dusk.entities.sgui.Entity#animationWait}` for calling when the event is
		 *  terminated. Keys are event names, while values are the functions to call.
		 * @type object
		 * @private
		 */
		this._aniWaits = {};
		/** The delay between two frames of animation, in frames.
		 * @type integer
		 * @default {@link dusk.entities.frameDelay}
		 */
		this.frameDelay = entities.frameDelay;
		/** The amount of time left before the next frame event is ran.
		 * @type integer
		 * @private
		 */
		this._frameCountdown = 0;
		
		/** The particle effect data for the entity, in the same format as described in the entity type
		 *  description. For speed, the second element of the value will be sliced once, and so will be
		 *  an array after the first time it is used.
		 * @type array
		 * @private
		 */
		this._particleData = [];
		/** Data used for storing how particle effects have acted. Each element is an object matching 
		 *  the corresponding particle data.
		 * 
		 * They have the following properties:
		 * - `cooldown`: The number of frames we are waiting until we can run the effect again.
		 * - `falsified`: Whether the critera has been false since it was last ran.
		 * @type object
		 * @private
		 */
		this._particleCriteria = [];
		
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
		/** The `dusk.particles.sgui.ParticleField` instance that this will insert its particle effects into.
		 * @type ?dusk.particles.sgui.ParticleField
		 */
		this.particles = null;
		/** The path to the particle field instance. Setting this will update it.
		 * @type string
		 */
		this.particlesPath = null;
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
		
		/** Used on triggers. If it is true, then the last trigger tree to be evaluated used the `on`
		 *  operator to successfully match against an event. This is used, for example, in 
		 *  `{@link dusk.entities.sgui.Entity#animationWait}` to check if an event was specifically "noticed".
		 * @type boolean
		 * @private
		 */
		this._eventTriggeredMark = false;
		
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
		this.sheight = entities.sheight;
		this.swidth = entities.swidth;
		this.width = entities.twidth;
		this.height = entities.theight;
		
		//Prop masks
		//this._registerPropMask("dx", "dx");
		//this._registerPropMask("dy", "dy");
		if(!this.isLight()) this._registerPropMask("scheme", "schemePath");
		if(!this.isLight()) this._registerPropMask("particles", "particlesPath");
		if(!this.isLight()) this._registerPropMask("fluid", "fluidPath");
		if(!this.isLight()) this._registerPropMask("entType", "entType");
		
		//Listeners
		if(!this.isLight()) if(this.collisionMark) this.prepareDraw.listen(this._collisionDraw.bind(this));
		if(!this.isLight()) {
			this.augment.listen((function(e) {
				this.onInteract.listen((function() {
					this.behaviourFire("mouseMove", {"x":this.mouse.x, "y":this.mouse.y});
					return true;
				}).bind(this), interaction.MOUSE_MOVE);
			}).bind(this), "mouse");
			
			this.onDelete.listen((function(e) {
				this.behaviourFire("delete", e);
			}).bind(this));
		}
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
	
	//particlesPath
	Object.defineProperty(Entity.prototype, "particlesPath", {
		get: function() {
			return this.particles?this.particles.fullPath():undefined;
		},
		
		set: function(value) {
			if(value) this.particles = this.path(value);
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
				this.behaviourData = utils.clone(entities.types.getAll(type).data);
				this._animationData = utils.clone(entities.types.getAll(type).animation);
				this._particleData = utils.clone(entities.types.getAll(type).particles);
			}else{
				this.behaviourData = {"headingLeft":false, "headingUp":false, "img":"nosuchimage.png",
					"solid":true, "collides":true
				};
				this._animationData = ["true", "0,0", {}];
				this._particleData = [];
			}
			
			//Set up animation
			this._currentAni = -1;
			this._particleCriteria = [];
			this._aniWaits = {};
			this.performAnimation("construct", true);
			
			//Basic properties
			if(!this.isLight()) this.prop("src", this.behaviourData.src);
			
			if("collisionWidth" in this.behaviourData) {
				this.collisionWidth = this.behaviourData.collisionWidth;
			} else this.collisionWidth = this.width;
			
			if("collisionHeight" in this.behaviourData) {
				this.collisionHeight = this.behaviourData.collisionHeight;
			} else this.collisionHeight = this.height;
			
			if("collisionOffsetX" in this.behaviourData) {
				this.collisionOffsetX = this.behaviourData.collisionOffsetX;
			} else this.collisionOffsetX = 0;
			
			if("collisionOffsetY" in this.behaviourData) {
				this.collisionOffsetY = this.behaviourData.collisionOffsetY;
			} else this.collisionOffsetY = 0;
			
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
	 * @param {object} accum The dyAccum or dyAccum object.
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
		
		// Accumuluate forces
		var psum = 0;
		var pforces = [];
		var pvels = [];
		var pvelsum = 0;
		
		var nsum = 0;
		var nforces = [];
		var nvels = [];
		var nvelsum = 0;
		
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
		
		// Friction!
		if(base > 0) nsum += 0.05;
		if(base < 0) psum += 0.05;
		
		var pleft = psum;
		var nleft = nsum;
		
		// Check collisions and remove accumulated veleration
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
		if(prop == "src" && set && !init) {
			this.src = set;
		}
		if(prop == "collisionWidth" && set !== undefined && !init) {
			this.collisionWidth = set;
		}
		if(prop == "collisionHeight" && set !== undefined && !init) {
			this.collisionHeight = set;
		}
		if(prop == "collisionOffsetX" && set !== undefined && !init) {
			this.collisionOffsetX = set;
		}
		if(prop == "collisionOffsetY" && set !== undefined && !init) {
			this.collisionOffsetY = set;
		}
		
		if(set !== undefined && (!init || !(prop in this.behaviourData))) {
			this.behaviourData[prop] = set;
			return set;
		}
		
		if(this.behaviourData && prop in this.behaviourData) {
			return this.behaviourData[prop];
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
		
		//Animation
		this._frameCountdown--;
		
		if(this._particleData) for(var i = this._particleCriteria.length-1; i >= 0; i --) {
			if(this._particleCriteria[i] && "cooldown" in this._particleCriteria[i] 
			&& this._particleCriteria[i].cooldown) {
				this._particleCriteria[i].cooldown --;
			}
		}
		
		this.performAnimation(null, this._frameCountdown <= 0);
	};
	
	/** Performs an animation or particle effect. This is called at least once per frame and once per
	 *  animation event, and looks through all possible animations and particle effects.
	 * 
	 * This can be used by behaviours, if they want to specify their own animation events.
	 * @param {?string} event If this is an event, then this is the name of the event.
	 * @param {boolean=false} advance Should only be used internally, if true, and there is no change in
	 *  animation, then the next action should be used.
	 * @return {boolean} Whether a new animation started as a result of an "on" clause appearing in the
	 *  animation trigger.
	 */
	Entity.prototype.performAnimation = function(event, advance) {
		//Particles
		if(this._particleData) for(var i = this._particleData.length-1; i >= 0; i --) {
			if(this.meetsTrigger(this._particleData[i][0], event)) {
				if(!this._particleCriteria[i]) this._particleCriteria[i] = {};
				if("cooldown" in this._particleCriteria[i] && this._particleCriteria[i].cooldown > 0) {
					continue;
				}
				if("falsified" in this._particleCriteria[i] && !this._particleCriteria[i].falsified) {
					continue;
				}
				
				if(this._particleData[i][2].initial === false
				&& !("falsified" in this._particleCriteria[i])) {
					// Do nothing
				}else{
					var frags = this._particleData[i][1].split("|");
					for(var j = 0; j < frags.length; j ++) {
						this._aniAction(event, frags[j]);
					}
				}
				
				if("cooldown" in this._particleData[i][2]) {
					this._particleCriteria[i].cooldown = this._particleData[i][2].cooldown;
				}
				
				if("onlyOnce" in this._particleData[i][2]) {
					this._particleCriteria[i].falsified = false;
				}
			}else{
				if(this._particleCriteria[i] && "falsified" in this._particleCriteria[i]) {
					this._particleCriteria[i].falsified = true;
				}
			}
		}
		
		//Locked animation
		if(this._aniLock) {
			if(advance) this._aniForward(event);
			if(this._frameCountdown <= 0) this._frameCountdown = this.frameDelay+1;
			return false;
		}
		
		//Look through animations
		for(var i = this._animationData.length-1; i >= 0; i --) {
			if(typeof this._animationData[i][1] == "string") {
				this._animationData[i][1] = this._animationData[i][1].split("|");
			}
			
			if(this.meetsTrigger(this._animationData[i][0], event)) {
				if(i == this._currentAni || (this._aniLock && !event)) {
					//Forward one frame
					if(advance) {
						this._aniPointer = (this._aniPointer + 1) % this._animationData[i][1].length;
						this._aniAction(event);
					}
				}else if(i != this._currentAni && !this._aniLock) {
					//Change animation
					this._setNewAni(i, event);
				}
				
				if(this._eventTriggeredMark) {
					//Lock animation if triggered by event
					this._aniLock = true;
				}
				
				if(this._frameCountdown <= 0) this._frameCountdown = this.frameDelay+1;
				return this._eventTriggeredMark;
			}
		}
	};
	
	/** Starts a new animation with the specified ID.
	 * @param {integer} id The index of the new animation.
	 * @param {?string} event The event that triggered this animation, if any.
	 * @private
	 */
	Entity.prototype._setNewAni = function(id, event) {
		this._currentAni = id;
		
		if(!this._animationData[id][2].supressSmooth
		&& this._animationData[id][1].indexOf(this.tileStr) !== -1) {
			this._aniPointer = this._animationData[id][1].indexOf(this.tileStr);
		}else{
			this._aniPointer = 0;
		}
		
		this._aniAction(event);
	};
	
	/** Does a single action for an animation. If none is specified, it will run the next one in the
	 *  current animation, and skip to the next action if needed. Otherwise, it will run the provided
	 *  one.
	 * @param {?string} event The event that provoked this, if appropriate.
	 * @param {?string} action The action to use, otherwise the current animation is used instead.
	 */
	Entity.prototype._aniAction = function(event, action) {
		var cont = action == undefined;
		if(!action) action = this._animationData[this._currentAni][1][this._aniPointer];
		
		switch(action.charAt(0)) {
			case "$":
				var frags = action.substr(1).split("=");
				this._aniVars[frags[0]] = frags[1];
				if(cont) this._aniForward(event);
				break;
			
			case "+":
				if(cont) this._frameCountdown = +action.substr(1);
				break;
			
			case "?":
				var frags = action.substr(1).split("?");
				if(this.meetsTrigger(frags[0])) {
					if(cont) this._aniForward(event, frags[1]);
				}else{
					if(cont) this._aniForward(event, frags[2]);
				}
				break;
			
			case ">":
				for(var i = this._animationData.length -1; i >= 0; i --) {
					if(this._animationData[i][2].name == action.substr(1)) {
						this._setNewAni(i, name);
						break;
					}
				}
				break;
			
			case "!":
				this.behaviourFire("animation", {"given":action.substr(1)});
				if(this.terminated && action.substr(1) == "terminate") this.deleted = true;
				if(cont) this._aniForward(event);
				break;
			
			case "\\":
			case "/":
				if(action.substr(1) in this._aniWaits) {
					this._aniWaits[action.substr(1)]();
				}
				
				if(action.charAt(0) == "/") {
					this._aniLock = false;
					//if(cont) this._aniForward(event);
					if(cont) this.performAnimation(undefined, true);
				}else {
					if(cont) this._aniForward(event);
				}
				
				break;
			
			case "*":
				var name = action.substr(1).split(" ")[0];
				var data = utils.jsonParse(action.substr(name.length+1));
				var keys = Object.keys(data);
				var p = "";
				for(var i = 0; i < keys.length; i ++) {
					p = keys[i];
					if(Array.isArray(data[p])) {
						data[p] = [this.evalTrigger(data[p][0]), this.evalTrigger(data[p][1])];
					}else{
						if(typeof data[p] == "string") data[p] = this.evalTrigger(data[p]);
					}
				}
				
				if(this.particles) this.particles.applyEffect(name, data);
				if(cont) this._aniForward(event);
				break;
			
			case "l":
				this._aniLock = false;
				//if(cont) this._aniForward(event);
				if(cont) this.performAnimation(undefined, true);
				break;
			
			case "L":
				this._aniLock = true;
				if(cont) this._aniForward(event);
				break;
			
			case "t":
				this.terminate();
				if(cont) this._aniForward(event);
				break;
			
			case "#":
				for(var i = 0; i < this.imageTrans.length; i ++) {
					if(this.imageTrans[i][0] == action.substr(2)) {
						this.imageTrans.splice(i, 1);
						i --;
					}
				}
				
				if(action.charAt(1) == "+") {
					this.imageTrans.push(action.substr(2).split(":"));
				}
				
				if(cont) this._aniForward(event);
				break;
			
			default:
				if(!this.isLight()) this.tileStr = action;
		}
	};
	
	/** Moves the animation pointer forward (looping if needed), and then does that action.
	 * @param {?string} event The event that provoked this.
	 * @param {integer=1} by The number of actions to skip past.
	 */
	Entity.prototype._aniForward = function(event, by) {
		if(by === undefined) by = 1;
		this._aniPointer = (this._aniPointer + by) % this._animationData[this._currentAni][1].length;
		this._aniAction(event);
	};
	
	
	
	//Triggers
	/** Alias to `{@link dusk.entities.sgui.Entity#evalTrigger}`.
	 * @param {*} trigger The trigger.
	 * @param {?string} event The name of the event, if appropriate.
	 * @return {*} The result of the evaluated parse tree.
	 * @depreciated
	 */
	Entity.prototype.meetsTrigger = function(trigger, event) {
		return this.evalTrigger(trigger, event);
	};

	/** Using the parse tree described in the class docs, will evaluate it, and return the value.
	 * 
	 * If the trigger isn't a string, it is returned exactly, if it is an empty string, true is
	 *  returned.
	 * @param {*} trigger The trigger.
	 * @param {?string} event The name of the event, if appropriate.
	 * @return {*} The result of the evaluated parse tree.
	 */
	Entity.prototype.evalTrigger = function(trigger, event) {
		if(typeof trigger != "string") return trigger;
		if(trigger.trim() == "") return true;
		this._eventTriggeredMark = false;
		this._currentEvent = event;
		
		//var t = performance.now();
		var e = _triggerTree.compile(trigger).eval({"ent":this, "currentEvent":event});
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
		["on", function(o, v, c) {
				if(c.currentEvent == v) {
					c.ent._eventTriggeredMark = true;
					return true;
				}
				return false;
			}, false
		],
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
		["$", function(o, v, c) {return c.ent._aniVars[v];}, false],
		[".", function(o, v, c) {
				if(c.ent.isLight()) return undefined;
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
	Entity.prototype.allTouchers = function(dir) {
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
	Entity.prototype.allTouchersNonSolid = function(dir) {
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
		
		if(this.y + this.width + offset - start < 0) return 0.0;
		if(this.y + this.width + offset - start > this.height) return 1.0;
		return (this.y + this.width + offset - start) / this.height;
	};
	
	
	/*dusk.entities.sgui.Entity.prototype.teather = function(target, dir) {
		this._teatherClients[this._teatherClients.length] = [target, dir];
		target.receiveTeather(this, dir);
	};

	dusk.entities.sgui.Entity.prototype.unteather = function(target) {
		target.receiveTeather(null, null);
		for(var i = this._teatherClients.length-1; i >= 0; i--) {
			if(this._teatherClients[i][0] == target) this._teatherClients.splice(i, 1);
		}
	};

	dusk.entities.sgui.Entity.prototype.receiveTeather = function(host, dir) {
		if(!host) this._teatherHost = null; else this._teatherHost = [host, dir];
		
	};

	dusk.entities.sgui.Entity.prototype.teatherClients = function() {
		return this._teatherClients;
	};*/
	
	
	
	//Misc
	/** Registered with the draw handler to draw a rectangle around this entity's hitbox.
	 * @param {object} e An event from `{@link dusk.sgui.Component#prepareDraw}`.
	 */
	Entity.prototype._collisionDraw = function(e) {
		e.c.strokeStyle = this.collisionMark;
		e.c.lineWidth = 1;
		e.c.strokeRect(
			e.d.destX + this.collisionOffsetX, e.d.destY + this.collisionOffsetY, 
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
			this.terminated = true;
			if(this.behaviourFireWithReturn("terminate", {}).indexOf(true) === -1) {
				this.animationWait("terminate", (function() {
					this.deleted = true;
				}).bind(this));
			}
		}).bind(this));
	};
	
	/** Fires an animation event, listened to with the trigger `on name`. If this doesn't specifically
	 *  target any animation, the function is called with no arguments, otherwise, the function will be
	 *  called when the animation action `/name` is ran.
	 * @param {string} name The animation event to wait for.
	 * @param {function():undefined} funct The function to call once the animation has terminated, or 
	 *  if there is no such animation.
	 */
	Entity.prototype.animationWait = function(name, funct) {
		if(!this.performAnimation(name)) {
			funct();
		}else{
			this._aniWaits[name] = funct;
		}
	};
	
	/** Returns if this is a light entity rather than an sgui entity.
	 * @return {boolean} True if this is an instance of `{@link dusk.entities.Entity}`, false if it is
	 *  an instance of `{@link dusk.entities.sgui.Entity}`.
	 */
	Entity.prototype.isLight = function() {
		return false;
	};
	
	sgui.registerType("Entity", Entity);
	return Entity;
})());


load.provide("dusk.entities.LightEntity", (function() {
	var Entity = load.require("dusk.entities.sgui.Entity");
	var entities = load.require("dusk.entities");
	var utils = load.require("dusk.utils");
	
	/**  Creates a new lightweight entity.
	 * 
	 * @param {string} type The initial type of this entity.
	 * 
	 * @class dusk.entities.LightEntity
	 * 
	 * @classdesc A Light Entity implements all of the properties and methods of
	 *  `{@link dusk.entities.sgui.Entity}`, but does not extend from a base class, meaning it cannot be used as
	 *  a sgui component.
	 * 
	 * It has all the properties of `{@link dusk.entities.sgui.Entity}`, so see that class.
	 * 
	 * It also has a `deleted` property, that should be checked to see if the entity was deleted.
	 * 
	 * @constructor
	 */
	var LightEntity = function(type) {
		Entity.call(this, null, null);
		
		this.entType = type;
		this.deleted = false;
	};
	
	for(var p in Entity.prototype) {
		if(Entity.prototype.hasOwnProperty(p)
		&& ["className", "schemePath", "particlesPath", "entType"].indexOf(p) === -1)
			LightEntity.prototype[p] = Entity.prototype[p];
	}
	
	/** Returns if this is a light entity rather than an sgui entity.
	 * @return {boolean} True if this is an instance of `{@link dusk.entities.LightEntity}`, false if it
	 *  is an instance of `{@link dusk.entities.sgui.Entity}`.
	 */
	LightEntity.prototype.isLight = function() {
		return true;
	};
	
	//Basic getters and setters, I see no way to copy these from the original
	//schemePath
	Object.defineProperty(LightEntity.prototype, "schemePath", {
		get: function() {
			return this.scheme?this.scheme.fullPath():undefined;
		},
		
		set: function(value) {
			if(value) this.scheme = this.path(value);
		}
	});
	
	//particlesPath
	Object.defineProperty(LightEntity.prototype, "particlesPath", {
		get: function() {
			return this.particles?this.particles.fullPath():undefined;
		},
		
		set: function(value) {
			if(value) this.particles = this.path(value);
		}
	});
	
	//entType
	Object.defineProperty(LightEntity.prototype, "entType", {
		get: function() {
			return this._type;
		},
		
		set: function(type) {
			// Get data
			this._type = type;
			this.behaviourData = utils.clone(entities.types.getAll(type).data);
			this._animationData = utils.clone(entities.types.getAll(type).animation);
			this._particleData = utils.clone(entities.types.getAll(type).particles);
			
			//Set up animation
			this._currentAni = -1;
			this._particleCriteria = [];
			this._aniWaits = {};
			this.performAnimation("construct", true);
			
			if("collisionWidth" in this.behaviourData) {
				this.collisionWidth = this.behaviourData.collisionWidth;
			} else this.collisionWidth = this.width;
			
			if("collisionHeight" in this.behaviourData) {
				this.collisionHeight = this.behaviourData.collisionHeight;
			} else this.collisionHeight = this.height;
			
			if("collisionOffsetX" in this.behaviourData) {
				this.collisionOffsetX = this.behaviourData.collisionOffsetX;
			} else this.collisionOffsetX = 0;
			
			if("collisionOffsetY" in this.behaviourData) {
				this.collisionOffsetY = this.behaviourData.collisionOffsetY;
			} else this.collisionOffsetY = 0;
			
			//Behaviours
			var beh = entities.types.getAll(type).behaviours;
			for(var b in beh) {
				if(beh[b]) this.addBehaviour(b, true);
			}
			
			//And fire event
			this.behaviourFire("typeChange");
		}
	});
	
	return LightEntity;
})());
