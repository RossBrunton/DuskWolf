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
 * Entities are essentially "things that doo stuff" in games, they are the player, enemies, pickups.
 * 	In general, if it is animated, it's an entity.
 * 
 * Entities are described using types, each entity has only one type, which describes how they act, their data and animations.
 * 	Entity types are simple objects with three properties, `data`, `animation` and `behaviours`.
 * 
 * 
 * Entity types are set using `{@link dusk.entities.modifyEntityType}`, which allows you to specify an entity to inherit from.
 * 	This means you can make an entity type that shares the same properties of another type easily.
 * 
 * The `data` property describes data used by the entity by its behaviours to do something.
 * 	If a property used by a behaviour is not in this object, it will be created automatically by the behaviour.
 * 	This is a standard object.
 * 
 * The `animation` property describes animation.
 * 	It is an object, the key names are animation names with optional flags (in the form `"name-flag"`), and the values are data that is used by the animation system, in frames seperated by "|".
 * 	Flags are specified when setting the animation as an array of strings, if the animation name and any flag (ones at the start of the array have priority) matches a key, then that animation will run.
 * 	Flags are optional, in that if no flags match, but the name (with no flags) does, then that animation will run.
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
	/** Sprite size of binary entities and tilemap tiles.
	 * 
	 * If the mode is binary, then this is considered to be the width and height of the tiles when reading them from the image.
	 * 
	 * This should be `n` such that the width and height of the sprite is `2^n`. If this is 4, then the sprites will be 16x16, for example.
	 * @type integer
	 * @default 4
	 */
	dusk.entities.ssize = 4;
	/** Sprite width of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the width of tiles when reading them from the image.
	 * @type integer
	 * @default 16
	 */
	this.swidth = 16;
	/** Sprite height of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the height of tiles when reading them from the image.
	 * @type number
	 * @default 16
	 */
	this.sheight = 16;
	
	/** Tile size of binary entities and tilemap tiles.
	 * 
	 * If the mode is binary, then this is considered to be the width and height of the tiles when drawing them to the canvas.
	 * 
	 * This should be `n` such that the width and height of the tile to draw is `2^n`. If this is 4, then the sprites will be 16x16, for example.
	 * @type integer
	 * @default 5
	 */
	this.tsize = 5;
	/** Tile width of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the width of tiles when drawing them to the canvas.
	 * @type number
	 * @default 32
	 */
	this.twidth = 32;
	/** Tile height of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the height of tiles when drawing them to the canvas.
	 * @type number
	 * @default 32
	 */
	this.theight = 32;
	
	/** The mode entities and tilemaps should run in.
	 * 
	 * This must be either `"DECIMAL"` or `"BINARY"`.
	 * @type string
	 * @default "BINARY"
	 * @see {@link dusk.sgui.Tile.mode}
	 */
	this.mode = "BINARY";
	
	/** The name of the "seek" entity.
	 * 
	 * `{@link dusk.sgui.BasicMain}` adds an entity with this name (and the type `{@link dusk.entities.seekType}`) as the "player".
	 * 
	 * In effect, this is the name of the player entity that moves between rooms, and the camera follows.
	 * @type string
	 * @default "hero"
	 */
	this.seek = "hero";
	/** The type of the "seek" entity.
	 * 
	 * `{@link dusk.sgui.BasicMain}` adds an entity with this type (and the name `{@link dusk.entities.seek}`) as the "player".
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
	/** An event dispatcher that is fired when persistant entity data is updated.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
	 * @type dusk.EventDispatcher
	 */
	this.persistDataUpdate = new dusk.EventDispatcher("dusk.entities.persistDataUpdate");
	
	/** An object containing persistant entity data, key name is the name of the entity, while data is it's data.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
	 * @type object
	 * @private
	 */
	this._persistData = {};
	
	/** An inheritable container containing all the defined entity types.
	 *	Use this to add or get entity types.
	 * @type dusk.InheritableContainer
	 */
	this.types = new dusk.InheritableContainer("dusk.entities.types");
	this.types.createNewType("root", {
		"data":{},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
	
	/** An object that contains all the behaviours that can be applied to entities.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._behaviours = {};
};

/** Stores entity data for a persistant entity.
 * 
 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
 * @param {string} name The name of the entity to store data for.
 * @param {object} data The actual data to save.
 */
dusk.entities.storePersist = function(name, data) {
	this._persistData[name] = data;
	data.entityName = name;
	this.persistDataUpdate.fire({"name":name, "data":data});
};

/** Returns stored entity data for a persistant entity.
 * 
 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
 * @param {string} name The name of the entity to store data for.
 * @return {object} The stored entity data for that entity.
 */
dusk.entities.getPersist = function(name) {
	return this._persistData[name];
};

/** Adds a new behaviour that can be added to entities. This must be called before the behaviour can be used.
 * @param {string} name The name of the added behaviour.
 * @param {class(dusk.sgui.Entity) extends dusk.behave.Behave} behaviour The behaviour to register.
 * @since 0.0.18-alpha
 */
dusk.entities.registerBehaviour = function(name, behaviour) {
	this._behaviours[name] = behaviour;
};

/** Returns a constructor for the specified behaviour, provided it has been registered beforehand with {@link dusk.entities.registerBehaviour}.
 * @param {string} name The name of the behaviour to look up.
 * @return {?class(dusk.sgui.Entity) extends dusk.behave.Behave} A constructor for the specified type, or null if it doesn't exist.
 * @since 0.0.18-alpha
 */
dusk.entities.getBehaviour = function(name) {
	if(!(name in this._behaviours)) return null;
	return this._behaviours[name];
};

dusk.entities._init();

Object.seal(dusk.entities);
