//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Entity", (function() {
	var Tile = load.require("dusk.sgui.Tile");
	var utils = load.require("dusk.utils");
	var parseTree = load.require("dusk.parseTree");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require("dusk.sgui");
	
	/**  Creates a new Entity.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * 
	 * @class dusk.sgui.Entity
	 * 
	 * @classdesc An entity is a component that has "behaviours" and can do certain activites, possibly
	 *  in response to another entity, or user input.
	 * 
	 * In a nutshell, it is a normal tile with a movement system, an animation system, a collision
	 *  system and a behaviour system added onto it.
	 * 
	 * Entities have a type, which describes how they look and what behaviours they have. This is set by
	 *  the `{@link dusk.sgui.Entity#entType}` property, and the types are managed by
	 *  `{@link dusk.entities}`. The documentation there gives a good description of what is required to
	 *  specify a type.
	 * 
	 * The movement system works along the lines of each entity having a `dx` and `dy` value, which
	 *  determine its horizontal and vertical speed respectivley. The speed is calculated using a number
	 *  of sources, which register themself using `{@link dusk.sgui.Entity#applyDx}` and 
	 *  `{@link dusk.sgui.Entity#applyDy}`, meaning each source can vary the speed they contribute to
	 *  the entity.
	 * 
	 * The animation system works based on choosing the highest priority animation and using it, unless
	 *  it is no lorger applicable or a higher priority animation needs to be run. The entity's type
	 *  determines the animations it performs. In the entity's type data there is an `animation` key,
	 *  which is an array of arrays.
	 * 
	 * Each array in this data is a single animation, the last one in the array that can be used will
	 *  be the one that is used. The first element is a trigger critera such that 
	 *  `{@link dusk.sgui.Entity#evalTrigger}` is true if and only if the animation should run. The
	 *  second is a string with "animation actions" as described below seperated by a "|" character.
	 *  The third element is an option which describes additional flags and settings for the animation.
	 * 
	 * The animation starts at the first animation frame, and then every 
	 *  `{@link dusk.sgui.Entity#frameDelay}` frames, it will move onto the next one, and execute it.
	 *  Some animation events cause the next one to be executed immediatley.
	 * 
	 * The animation actions are determined by the first character in the string, as follows:
	 * 
	 * - `$var=value`: Sets an animation variable to the specified value. This can be used for evaling
	 *  triggers using the `$` operator.
	 * - `+time`: Waits `time` frames before moving onto the next action.
	 * - `?trigger?yes?no`: Evaluates the trigger and skips forward `yes` actions if it is true, and 
	 * `no` actions if it is false, and executes that action.
	 * - `>animation`: Switches the current animation to the one with the name `animation`, and executes
	 *  the first action.
	 * - `!event`: Fires the behaviour event `event` and then moves onto the next animation action and
	 *  executes it.
	 * - `/event`: If this animation event is blocking some other event `event`, then this will
	 *  terminate that event, and cause the block to be removed.
	 * - `*pname data`: Does the particle effect named `pname` with the data `data`. Data should be a 
	 *  json string, and each of it's keys will be fed through `{@link dusk.sgui.Entity#evalTrigger}`.
	 *  The next event is executed.
	 * - `L`: Locks the current animation, so it can't change until the lock is released, and then move 
	 *  onto and execute the next animation action.
	 * - `l`: Removes any lock, and then move onto and execute the next action.
	 * - `x,y`: Where x and y are integers, sets the current tile to the tile specified.
	 * - `#+trans;`: Adds the transformation `trans` to this entity's image, replacing it if it already exists.
	 * - `#-trans;`: Removes the transformation `trans` from this entity's image.
	 * 
	 * The third element has the following possible keys:
	 * 
	 * - `name`: a string; the name of the animation, for use with the `>` event.
	 * - `suppressSmooth`: a boolean; if false or ommited, then if the entity's current frame is
	 *  anywhere in this animation's action list, then it will be skipped to. 
	 * 
	 * A particle effects system is also provided, which works on almost the same way as the animation
	 *  system. In the entity's data, there is also a "particles" property, which has the same format.
	 * 
	 * The difference is that only one animation can run at a time, yet more than one particle effect
	 *  can also run. Also, while animations step through their action, particle effects run them all at
	 *  once. The same animation events are used for particle effects, although only `$`, `*` and `t` should
	 *  be used.
	 * 
	 * Additional "third element properties" can be set on particle effects:
	 * 
	 * - `onlyOnce`: A boolean; if true, then the effect will run only after if it's criteria has been
	 *  false between the last time it ran and now.
	 * - `cooldown`: An integer; the time in frames the effect must wait until it is ran again.
	 * 
	 * Due to the nature of animations, at least one of `onlyOnce` or `cooldown` must be specified, as 
	 *  the function that resolves animations may be called more than once a frame.
	 * 
	 * Entities can collide with each other, if they are in a `{@link dusk.sgui.EntityGroup}`. The
	 *  collision hit box is a rectangle from the coordinates
	 *  (`x+{@link dusk.sgui.Entity#collisionOffestX}`, `y+{@link dusk.sgui.Entity#collisionOffestY}`)
	 *  to (`x+{@link dusk.sgui.Entity#collisionWidth}`, `y+{@link dusk.sgui.Entity#collisionHeight}`).
	 *  The function `{@link dusk.sgui.Entity#touchers}` can be used to get a list of components 
	 *  touching this one on the specified side.
	 * 
	 * Entities can have behaviours on them. Behaviours available are as an object on the `behaviours`
	 *  property of the entity type description. Each key of this object is the name of a behaviour,
	 *  while the value is a boolean for whether the entity should have this behaviour.
	 * 
	 * Behaviours are subclasses of `{@link dusk.behave.Behave}`, and must be registered using 
	 *  `{@link dusk.entities.registerBehaviour}` before they can be used. Entity behaviours share a
	 *  pool of data between themselves and the animation system, this is the object
	 *  `{@link dusk.sgui.Entity#behaviourData}`, and can be accessed using
	 *  `{@link dusk.sgui.Entity#eProp}` or `{@link dusk.behave.Behave._data}`.
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
	 * - `collisionWidth`,`collisionHeight`,`collisionOffsetX`,`collisionOffsetY`: Mapping to the
	 *  respective properties.
	 * 
	 * Behaviours may also fire and listen to events between themselves and their entity. Events are
	 *  fired using `{@link dusk.sgui.Entity#behaviourFire}` and listened to on each behaviour's
	 *  `{@link dusk.behave.Behave.entityEvent}` dispatcher.
	 * 
	 * Each event has a name and an object event. On the event object as listened to, the name of the
	 *  event will be the `name` property of the event object.
	 * 
	 * There are some "built in" events:
	 * 
	 * - `typeChange`: Called when the entity has just finished changing types to the current one.
	 *  Event object is empty.
	 * - `beforeMove`: Called just before the collisions are to be resolved, the event object is empty.
	 * - `frame`: Called once per frame, after the collisions are resolved, and before the entities are
	 *  drawn. Event object is empty.
	 * - `animation`: Called when an animation event is fired using `!`. The event object has one
	 *  property, `given`, which is the bit after the `!` character.
	 * - `terminate`: Called when the entity is about to be terminated, the listener should return true
	 *  if they don't want the entity to terminate. The event object has no properties.
	 * - `collide`: Fired by `{@link dusk.sgui.EntityGroup}` when this entity collides into another
	 *  entity or a wall. The event object has two properties; `dir` a dusk.sgui.c.DIR_* constant
	 *  representing the side that collided, and `target`, the entity that it collided into, or the
	 *  string `"wall"`.
	 * - `collidedInto`: Fired by `{@link dusk.sgui.EntityGroup}` when this is collided into by another
	 *  entity. The event object has two properties; `dir` a dusk.sgui.c.DIR_* constant representing the
	 *  side that collided, and `target`, the entity that collided into this one.
	 * - `controlActive`: Fired by all behaviours when they want to check a control is active. A
	 *  listener should return true if they want to declare that the control is active. This has one
	 *  property, `control`, the name of the control. If the entity data has an array `controlsOn` that
	 *  contains the control name, then this event is not fired, and the control is assumed on.
	 * 
	 * There are "triggers", which are essentially strings that evaluate into a constant value
	 *  according to rules. They are used in animation and particle effects, as the first element of
	 *  the array where they are checked if they are true or false. They are also used in behaviours,
	 *  to allow a more fine control on what they interact with.
	 * 
	 * They are essentially fed to a parse tree from `{@link dusk.parseTree}`, and support the following
	 *  operators, low to high priority, in addition to the basic ones:
	 * 
	 * - `on event`: True iff this trigger is being evaluated because of the animation event `event`.
	 * - `#dx`: The entity's horizontal speed.
	 * - `#dy`: The entity's vertical speed.
	 * - `#tb`: The number of entities touching the bottom of this.
	 * - `#tu`: The number of entities touching the top of this.
	 * - `#tl`: The number of entities touching the left of this.
	 * - `#tr`: The number of entities touching the right of this.
	 * - `#path`: The path to this entity.
	 * - `$var`: The value of the animation variable `var`.
	 * - `.var`: The value of the component property `var`.
	 * - `:var`: The value of the entity data property `var`.
	 * 
	 * @extends dusk.sgui.Tile
	 * @constructor
	 */
	var Entity = function(parent, comName) {
		if(!this.isLight()) Tile.call(this, parent, comName);
		
		/** An object containing all the sources of horizontal motion.
		 * Each key is the name of the source, and each value is an array of the form 
		 * `[value, duration, accel, limit]` as per `{@link dusk.sgui.Entity#applyDx}`.
		 * @type object
		 * @private
		 */
		this._dx = {};
		/** An object containing all the sources of vertical motion.
		 * Each key is the name of the source, and each value is an array of the form 
		 * `[value, duration, accel, limit]` as per `{@link dusk.sgui.Entity#applyDy}`.
		 * @type object
		 * @private
		 */
		this._dy = {};
		/** An object containing all the dx multiplications.
		 * Each key is the name of the source, and each value is an array of the form 
		 * `[factor, duration, ignores]` as per `{@link dusk.sgui.Entity#multDx}`.
		 * @type object
		 * @private
		 */
		this._dxMults = {};
		/** An object containing all the dy multiplications.
		 * Each key is the name of the source, and each value is an array of the form 
		 * `[factor, duration, ignores]` as per `{@link dusk.sgui.Entity#multDy}`.
		 * @type object
		 * @private
		 */
		this._dyMults = {};
		
		/** All the behaviours that this entity is using. Each key name is the name of the behaviour,
		 *  and the value is a `{@link dusk.behave.Behave}` instance.
		 * @type object
		 * @private
		 */
		this._behaviours = {};
		/** The entity's behaviour data. This is data used by the entity's behaviour objects. It
		 *  it contains stuff such as HP and gravity.
		 * @type object
		 */
		this.behaviourData = {};
		/** An event disptacher that fires when an entity event happens.
		 * 
		 * Firing this event does nothing, use `{@link dusk.sgui.Entity#behaviourFire}` instead.
		 * @type dusk.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.entityEvent = new EventDispatcher("dusk.sgui.Entity.entityEvent", EventDispatcher.MODE_LAST);
		
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
		/** The functions set by `{@link dusk.sgui.Entity#animationWait}` for calling when the event is
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
		
		/** The offset for the x coordinate for this entity's hitbox.
		 * @type integer
		 */
		this.collisionOffsetX = 0;
		/** The offset for the y coordinate for this entity's hitbox.
		 * @type integer
		 */
		this.collisionOffsetY = 0;
		/** The width of this entity's hitbox plus `{@link dusk.sgui.Entity#collisionOffsetX}`.
		 * @type integer
		 */
		this.collisionWidth = 0;
		/** The height of this entity's hitbox plus `{@link dusk.sgui.Entity#collisionOffsetY}`.
		 * @type integer
		 */
		this.collisionHeight = 0;
		
		/** If not empty, then a rectangle of this colour will be drawn showing the entity's hitbox.
		 * @type string
		 * @default ""
		 */
		this.collisionMark = "";
		
		/** The `{@link dusk.sgui.TileMap}` instance that serves as this entity's schematic layer.
		 * 
		 * This will be used to calculate collisions with wall.
		 * @type ?dusk.sgui.TileMap
		 */
		this.scheme = null;
		/** The path to the scheme instance. Setting this will update the scheme instance.
		 * @type string
		 */
		this.schemePath = null;
		/** The `{@link dusk.sgui.ParticleField}` instance that this will insert it's particle effects
		 *  into.
		 * @type ?dusk.sgui.ParticleField
		 */
		this.particles = null;
		/** The path to the particle field instance. Setting this will update it.
		 * @type string
		 */
		this.particlesPath = null;
		
		/** Use this to check if the entity is terminated or not, this is set to true by
		 *  `{@link dusk.sgui.Entity#terminate}`, and means the entity is set for deleting when an
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
		 *  `{@link dusk.sgui.Entity#animationWait}` to check if an event was specifically "noticed".
		 * @type boolean
		 * @private
		 */
		this._eventTriggeredMark = false;
		/** The current animation event, if there is one.
		 * @type ?string
		 * @private
		 */
		this._currentEvent = "";
		/** The parse tree used for evaluating triggers.
		 * @type dusk.parseTree
		 * @private
		 */
		this._triggerTree = new parseTree.Compiler([], [
			["on", (function(o, v) {
					if(this._currentEvent == v) {
						this._eventTriggeredMark = true;
						return true;
					}
					return false;
				}).bind(this), false
			],
			["#", (function(o, v) {
					switch(v) {
						case "dx": return this.getDx();
						case "dy": return this.getDy();
						case "tb": return this.touchers(c.DIR_DOWN).length;
						case "tu": return this.touchers(c.DIR_UP).length;
						case "tl": return this.touchers(c.DIR_LEFT).length;
						case "tr": return this.touchers(c.DIR_RIGHT).length;
						case "path": return this.fullPath();
						default: return "#"+v;
					}
				}).bind(this), false
			],
			["$", (function(o, v) {return this._aniVars[v];}).bind(this), false],
			[".", (function(o, v) {
					if(this.isLight()) return undefined;
					return this.prop(v);
				}).bind(this), false],
			[":", (function(o, v) {return this.eProp(v);}).bind(this), false],
			["stat", (function(o, v) {return this.stats?this.stats.get(v[0], v[1]):undefined;}).bind(this), false],
			["stati", (function(o, v) {return this.stats?this.stats.geti(v[0], v[1]):undefined;}).bind(this), false],
		], []);
		
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
		if(!this.isLight()) this._registerPropMask("entType", "entType");
		
		//Listeners
		if(!this.isLight()) if(this.collisionMark) this.prepareDraw.listen(this._collisionDraw, this);
		if(!this.isLight()) {
			this.augment.listen((function(e) {
				this.mouse.move.listen((function() {
					this.behaviourFire("mouseMove", {"x":this.mouse.x, "y":this.mouse.y});
				}).bind(this));
			}).bind(this), {"augment":"mouse"});
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
	/** Returns the horizontal speed of this entity.
	 * @return {integer} The entity's dx value.
	 */
	Entity.prototype.getDx = function() {
		var dx = 0;
		for(var p in this._dx) {
			var hold = this._dx[p][0];
			for(var i in this._dxMults) {
				if(this._dxMults[i][2].indexOf(p) === -1) {
					hold *= this._dxMults[i][0];
				}
			}
			dx += hold;
		}
		return dx;
	};

	/** Returns the vertical speed of this entity.
	 * @return {integer} The entity's dx value.
	 */
	Entity.prototype.getDy = function() {
		var dy = 0;
		for(var p in this._dy) {
			var hold = this._dy[p][0];
			for(var i in this._dyMults) {
				if(this._dyMults[i][2].indexOf(p) === -1) {
					hold *= this._dyMults[i][0];
				}
			}
			dy += hold;
		}
		return dy;
	};

	/** Applys a horizontal speed and acceleration to the entity.
	 * @param {string} name The name of the source of this dx, used to change it later.
	 * @param {integer} value The initial value for the speed.
	 * @param {duration=-1} duration The number of frames the speed and acceleration effects last for.
	 *  A value of -1 means it will never stop.
	 * @param {float=0} accel The acceleration, this value will be added to the speed every frame.
	 * @param {?integer} limit The maximum or minimum speed, the speed will not increase past this, or 
	 *  decrease below this. If it is undefined, there is no limit.
	 * @param {boolean=false} noReplace If true and the speed already exists, the value will not be
	 *  changed, but all the other values will be. If it is false, then the value will be reset.
	 */ 
	Entity.prototype.applyDx = function(name, value, duration, accel, limit, noReplace) {
		if(duration == undefined) duration = -1;
		if(!accel) accel = 0;
		if(noReplace && name in this._dx) value = this._dx[name][0];
		this._dx[name] = [value, duration, accel, limit];
		
		if(this.getDx() < 0) this.eProp("lastMoveLeft", true);
		if(this.getDx() > 0) this.eProp("lastMoveLeft", false);
	};

	/** Applys a vertical speed and acceleration to the entity.
	 * @param {string} name The name of the source of this dy, used to change it later.
	 * @param {integer} value The initial value for the speed.
	 * @param {duration=-1} duration The number of frames the speed and acceleration effects last for.
	 *  A value of -1 means it will never stop.
	 * @param {float=0} accel The acceleration, this value will be added to the speed every frame.
	 * @param {?integer} limit The maximum or minimum speed, the speed will not increase past this, or 
	 *  decrease below this. If it is undefined, there is no limit.
	 * @param {boolean=false} noReplace If true and the speed already exists, the value will not be
	 *  changed, but all the other values will be. If it is false, then the value will be reset.
	 */
	Entity.prototype.applyDy = function(name, value, duration, accel, limit, noReplace) {
		if(duration == undefined) duration = -1;
		if(!accel) accel = 0;
		if(noReplace && name in this._dy) value = this._dy[name][0];
		this._dy[name] = [value, duration, accel, limit];
		
		if(this.getDy() < 0) this.eProp("lastMoveUp", true);
		if(this.getDy() > 0) this.eProp("lastMoveUp", false);
	};

	/** Applies a multiplication factor onto the dx. This multiplies the dx value by some value, and can
	 *  be used to stop motion if the factor is 0.
	 * @param {string} name The name of the mult, so it can be referred to later.
	 * @param {float} factor The factor to multiply each dx vaue by.
	 * @param {integer=-1} duration The duration of the effect, or -1 for no limit to the duration.
	 * @param {array=[]} ignores An array of strings, each value is a dx source which will NOT be
	 *  multiplied.
	 */
	Entity.prototype.multDx = function(name, factor, duration, ignores) {
		if(duration === undefined) duration = -1;
		if(!ignores) ignores = [];
		if(factor == 1.0) delete this._dxMults[name];
		else this._dxMults[name] = [factor, duration, ignores];
	};

	/** Applies a multiplication factor onto the dy. This multiplies the dy value by some value, and can
	 *  be used to stop motion if the factor is 0.
	 * @param {string} name The name of the mult, so it can be referred to later.
	 * @param {float} factor The factor to multiply each dy vaue by.
	 * @param {integer=-1} duration The duration of the effect, or -1 for no limit to the duration.
	 * @param {array=[]} ignores An array of strings, each value is a dy source which will NOT be
	 *  multiplied.
	 */
	Entity.prototype.multDy = function(name, factor, duration, ignores) {
		if(duration === undefined) duration = -1;
		if(!ignores) ignores = [];
		if(factor == 1.0) delete this._dyMults[name];
		else this._dyMults[name] = [factor, duration, ignores];
	};

	/** Called before all entities are moved by `{@link dusk.sgui.EntityGroup}`, and causes all the 
	 *  speeds of this entity to accelerate or decelerate if needed.
	 * 
	 * This also resets the touchers, so it should be called before collisions are checked.
	 * 
	 * It also fires a `beforeMove` behaviour event with an empty event object.
	 */
	Entity.prototype.beforeMove = function() {
		//Clear touchers
		this._touchers[c.DIR_UP] = [];
		this._touchers[c.DIR_DOWN] = [];
		this._touchers[c.DIR_LEFT] = [];
		this._touchers[c.DIR_RIGHT] = [];
		
		//Accelerate or decelerate
		for(var p in this._dx) {
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
		}
		
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
		this.entityEvent.fire(data);
		var keys = Object.keys(this._behaviours);
		for(var b = keys.length-1; b >= 0; b --) {
			this._behaviours[keys[b]].entityEvent.fire(data);
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
		output[0] = this.entityEvent.fire(data);
		var keys = Object.keys(this._behaviours);
		for(var b = keys.length-1; b >= 0; b --) {
			output.push(this._behaviours[keys[b]].entityEvent.fire(data));
		}
		
		return output;
	};

	/** Adds a new behaviour to this entity.
	 * @param {string} name The name of the behaviour to add.
	 * @param {boolean=false} reInit If the behaviour already exists and this is true, it will be
	 *  deleted and recreated, else nothing happens.
	 * @return {?dusk.behave.Behave} The behaviour that was added, or null if it wasn't added.
	 */
	Entity.prototype.addBehaviour = function(name, reInit) {
		if(name in this._behaviours && !reInit) return null;
		if(!entities.getBehaviour(name)) {
			console.error("Behaviour "+name+" does not exist for "+this.entType);
			return;
		}
		this._behaviours[name] = new (entities.getBehaviour(name))(this);
	};

	/** Sets an entity data property to the value, or returns it if no value is specified.
	 * @param {string} prop The name of the property to set or get.
	 * @param {?*} set The value to set the property, if no value is provided, then nothing will be set.
	 * @return {*} The value of the specified property.
	 */
	Entity.prototype.eProp = function(prop, set) {
		if(prop == "src" && set) {
			this.src = set;
		}
		if(prop == "collisionWidth" && set !== undefined) {
			this.collisionWidth = set;
		}
		if(prop == "collisionHeight" && set !== undefined) {
			this.collisionHeight = set;
		}
		if(prop == "collisionOffsetX" && set !== undefined) {
			this.collisionOffsetX = set;
		}
		if(prop == "collisionOffsetY" && set !== undefined) {
			this.collisionOffsetY = set;
		}
		
		if(set !== undefined) {
			this.behaviourData[prop] = set;
			return set;
		}
		
		if(this.behaviourData && prop in this.behaviourData) {
			return this.behaviourData[prop];
		}
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
			
			case "/":
				if(action.substr(1) in this._aniWaits) {
					this._aniWaits[action.substr(1)]();
				}
				if(cont) this._aniForward(event);
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
				if(cont) this._aniForward(event);
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
	/** Alias to `{@link dusk.sgui.Entity#evalTrigger}`.
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
		var e = this._triggerTree.compile(trigger).eval();
		//var ta = performance.now() - t;
		//t = performance.now();
		////var f = this._triggerTree.compileToFunct(trigger)();
		//var tb = performance.now() - t;
		//console.log(ta + " vs " + tb);
		
		
		return e;
	};



	//Touchers
	/** Returns an array of either `{@link dusk.sgui.Entity}` instances or the string `"wall"` which are
	 *  touching this entity on the specified side.
	 * @param {integer} dir The specified direction, one of the `dusk.sgui.c.DIR_*` constants.
	 * @return {array} The things touching this entity on the specified side.
	 */
	Entity.prototype.touchers = function(dir) {
		if(!(dir in this._touchers)) {console.warn("Unknown dir "+dir+" for touching!"); return [];}
		return this._touchers[dir];
	};

	/** Called by `{@link dusk.sgui.EntityGroup}` to indicate that the specified entity is touching it.
	 * @param {integer} dir The side it is touching this, one of the `dusk.sgui.c.DIR_*` constants.
	 * @param {dusk.sgui.Entity|string} entity The entity touching this, or the string `"wall"`.
	 */
	Entity.prototype.addToucher = function(dir, entity) {
		this._touchers[dir].push(entity);
	};



	/*dusk.sgui.Entity.prototype.teather = function(target, dir) {
		this._teatherClients[this._teatherClients.length] = [target, dir];
		target.receiveTeather(this, dir);
	};

	dusk.sgui.Entity.prototype.unteather = function(target) {
		target.receiveTeather(null, null);
		for(var i = this._teatherClients.length-1; i >= 0; i--) {
			if(this._teatherClients[i][0] == target) this._teatherClients.splice(i, 1);
		}
	};

	dusk.sgui.Entity.prototype.receiveTeather = function(host, dir) {
		if(!host) this._teatherHost = null; else this._teatherHost = [host, dir];
		
	};

	dusk.sgui.Entity.prototype.teatherClients = function() {
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
	 *  `{@link dusk.sgui.Entity#animationWait}` is called with a `terminate` event with the callback 
	 *  deleting this element.
	 * 
	 * This should be used if you want the entity to animate it's death, otherwise, if you just want it
	 *  gone without any effects, set it's `{@link dusk.sgui.Component#deleted}` property to true.
	 */
	Entity.prototype.terminate = function() {
		this.terminated = true;
		if(this.behaviourFireWithReturn("terminate", {}).indexOf(true) === -1) {
			this.animationWait("terminate", (function() {this.deleted = true;}).bind(this));
		}
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
	 *  an instance of `{@link dusk.sgui.Entity}`.
	 */
	Entity.prototype.isLight = function() {
		return false;
	};

	Object.seal(Entity);
	Object.seal(Entity.prototype);

	sgui.registerType("Entity", Entity);
	return Entity;
})());


load.provide("dusk.entities.LightEntity", (function() {
	var Entity = load.require("dusk.sgui.Entity");
	
	/**  Creates a new lightweight entity.
	 * 
	 * @param {string} type The initial type of this entity.
	 * 
	 * @class dusk.entities.LightEntity
	 * 
	 * @classdesc A Light Entity implements all of the properties and methods of
	 *  `{@link dusk.sgui.Entity}`, but does not extend from a base class, meaning it cannot be used as
	 *  a sgui component.
	 * 
	 * It has all the properties of `{@link dusk.sgui.Entity}`, so see that class.
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
	 *  is an instance of `{@link dusk.sgui.Entity}`.
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
			this.behaviourData = dusk.utils.clone(dusk.entities.types.getAll(type).data);
			this._animationData = dusk.utils.clone(dusk.entities.types.getAll(type).animation);
			this._particleData = dusk.utils.clone(dusk.entities.types.getAll(type).particles);
			
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
			var beh = dusk.entities.types.getAll(type).behaviours;
			for(var b in beh) {
				if(beh[b]) this.addBehaviour(b, true);
			}
			
			//And fire event
			this.behaviourFire("typeChange");
		}
	});
	
	Object.seal(LightEntity);
	Object.seal(LightEntity.prototype);
	
	return LightEntity;
})());
