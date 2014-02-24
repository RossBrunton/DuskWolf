//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.InheritableContainer");

dusk.load.provide("dusk.entities");

/** @namespace dusk.entities
 * @name dusk.entities
 * 
 * @description This manages entities.
 * 
 * Entities are essentially "things that do stuff" in games, they are the player, enemies, pickups.
 * 	In general, if it is animated, it's an entity.
 * 
 * Entities are described using types;
 *  each entity has only one type which describes how they act, their data and animations.
 * 	Entity types are simple objects with three properties, `data`, `animation` and `behaviours`.
 * 
 * Entity types are set using the `{@link dusk.entities.types}` inheritable container, which 
 *  allows you to specify an entity to inherit from. This means you can make an entity type that 
 *  shares the same properties of another type easily.
 * 
 * The `data` property describes data used by the entity by its behaviours to do something.
 * 	If a property used by a behaviour is not in this object, it will be created automatically by the
 *  behaviour. This is a standard object.
 * 
 * The `animation` property describes animation, and is described at `{@link dusk.sgui.Entity}`.
 * 
 * @since 0.0.17-alpha
 * @see {@link dusk.sgui.Entity}
 * @see {@link dusk.sgui.EntityGroup}
 * @see {@link dusk.sgui.BasicMain}
 */
 
/** Initiates this, setting up all the variables.
 * @private
 */
dusk.entities._init = function() {
	/** Sprite width of entities and tilemap tiles.
	 * 
	 * This is the width of tiles when reading them from the image.
	 * @type integer
	 * @default 16
	 */
	this.swidth = 16;
	/** Sprite height of entities and tilemap tiles.
	 * 
	 * This is the height of tiles when reading them from the image.
	 * @type number
	 * @default 16
	 */
	this.sheight = 16;
	
	/** Tile width of entities and tilemap tiles.
	 * 
	 * This is the width of tiles when drawing them to the canvas.
	 * @type integer
	 * @default 32
	 */
	this.twidth = 32;
	/** Tile height of entities and tilemap tiles.
	 * 
	 * Then this is the height of tiles when drawing them to the canvas.
	 * @type integer
	 * @default 32
	 */
	this.theight = 32;
	
	/** Default frame delay for animation.
	 * 
	 * This is the amount of time, by default, to wait between each animation event on every entity.
	 * @type integer
	 * @default 5
	 */
	this.frameDelay = 5;
	
	/** The name of the "seek" entity.
	 * 
	 * `{@link dusk.sgui.BasicMain}` adds an entity
	 *  with this name and the type `{@link dusk.entities.seekType}` as the "player".
	 * 
	 * In effect, this is the name of the player entity that moves between rooms, and the camera follows.
	 * @type string
	 * @default "hero"
	 */
	this.seek = "hero";
	/** The type of the "seek" entity.
	 * 
	 * `{@link dusk.sgui.BasicMain}` adds an entity
	 *  with this type and the name `{@link dusk.entities.seek}` as the "player".
	 * 
	 * In effect, this is the name of the player entity that moves between rooms, and the camera follows.
	 * @type string
	 * @default "player"
	 */
	this.seekType = "player";
	
	/** An event dispatcher that is fired when a "mark" is triggered.
	 * 
	 * See `{@link dusk.behaviours.MarkTrigger}` for details on marks.
	 * @type dusk.EventDispatcher
	 */
	this.markTrigger = new dusk.EventDispatcher("dusk.entities.markTrigger");
	
	/** An inheritable container containing all the defined entity types.
	 *	Use this to add or get entity types.
	 * @type dusk.InheritableContainer
	 */
	this.types = new dusk.InheritableContainer("dusk.entities.types");
	this.types.createNewType("root", {
		"data":{"solid":true, "collides":true},
		"animation":[["", "0,0", {}]],
		"behaviours":{}
	});
	
	/** An object that contains all the behaviours that can be applied to entities.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._behaviours = {};
};

/** Adds a new behaviour that can be added to entities. This must be called before the behaviour can be used.
 * @param {string} name The name of the added behaviour.
 * @param {class(dusk.sgui.Entity) extends dusk.behave.Behave} behaviour The behaviour to register.
 * @since 0.0.18-alpha
 */
dusk.entities.registerBehaviour = function(name, behaviour) {
	this._behaviours[name] = behaviour;
};

/** Returns a constructor for the specified behaviour, 
 *  provided it has been registered beforehand with {@link dusk.entities.registerBehaviour}.
 * @param {string} name The name of the behaviour to look up.
 * @return {?class(dusk.sgui.Entity) extends dusk.behave.Behave} A constructor for the specified type, 
 *  or null if it doesn't exist.
 * @since 0.0.18-alpha
 */
dusk.entities.getBehaviour = function(name) {
	if(!(name in this._behaviours)) return null;
	return this._behaviours[name];
};

dusk.entities._init();
