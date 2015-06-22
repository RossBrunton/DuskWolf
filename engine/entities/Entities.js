//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities", (function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var InheritableContainer = load.require("dusk.utils.InheritableContainer");
	
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
	 * The `animation` property describes animation, and is described at `{@link dusk.entities.sgui.Entity}`.
	 * 
	 * @since 0.0.17-alpha
	 * @see {@link dusk.entities.sgui.Entity}
	 * @see {@link dusk.entities.sgui.EntityGroup}
	 * @see {@link dusk.rooms.sgui.LayeredRoom}
	 */
	var entities = {};
	
	/** Tile width of entities and tilemap tiles.
	 * 
	 * This is the width of tiles when drawing them to the canvas.
	 * @type integer
	 * @default 32
	 */
	entities.twidth = 32;
	/** Tile height of entities and tilemap tiles.
	 * 
	 * Then this is the height of tiles when drawing them to the canvas.
	 * @type integer
	 * @default 32
	 */
	entities.theight = 32;
	
	/** Default frame delay for animation.
	 * 
	 * This is the amount of time, by default, to wait between each animation event on every entity.
	 * @type integer
	 * @default 5
	 */
	entities.frameDelay = 5;
	
	/** The name of the "seek" entity.
	 * 
	 * `{@link dusk.rooms.sgui.LayeredRoom}` adds an entity
	 *  with this name and the type `{@link dusk.entities.seekType}` as the "player".
	 * 
	 * In effect, this is the name of the player entity that moves between rooms, and the camera follows.
	 * @type string
	 * @default "hero"
	 */
	entities.seek = "hero";
	/** The type of the "seek" entity.
	 * 
	 * `{@link dusk.rooms.sgui.LayeredRoom}` adds an entity
	 *  with this type and the name `{@link dusk.entities.seek}` as the "player".
	 * 
	 * In effect, this is the name of the player entity that moves between rooms, and the camera follows.
	 * @type string
	 * @default "player"
	 */
	entities.seekType = "player";
	
	/** An event dispatcher that is fired when a "mark" is triggered.
	 * 
	 * See `{@link dusk.behaviours.MarkTrigger}` for details on marks.
	 * @type dusk.utils.EventDispatcher
	 */
	entities.markTrigger = new EventDispatcher("dusk.entities.markTrigger");
	
	/** An inheritable container containing all the defined entity types.
	 *	Use this to add or get entity types.
	 * @type dusk.utils.InheritableContainer
	 */
	entities.types = new InheritableContainer("dusk.entities.types");
	entities.types.createNewType("root", {
		"data":{"solid":true, "collides":true},
		"animation":[["", "0,0", {}]],
		"behaviours":{}
	});
	
	/** An object that contains all the behaviours that can be applied to entities.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	var _behaviours = {};
	
	/** Workshop data for all behaviours.
	 * @type object
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _workshop = {};

	/** Adds a new behaviour that can be added to entities. This must be called before the behaviour can be used.
	 * @param {string} name The name of the added behaviour.
	 * @param {class(dusk.entities.sgui.Entity) extends dusk.entities.behave.Behave} behaviour The behaviour to register.
	 * @since 0.0.18-alpha
	 */
	entities.registerBehaviour = function(name, behaviour) {
		_behaviours[name] = behaviour;
		
		//Legacy code, remove when all behaviours use registerWorkshop
		if(behaviour.workshopData) {
			entities.registerWorkshop(name, behaviour.workshopData);
		}
	};

	/** Returns a constructor for the specified behaviour, 
	 *  provided it has been registered beforehand with {@link dusk.entities.registerBehaviour}.
	 * @param {string} name The name of the behaviour to look up.
	 * @return {?class(dusk.entities.sgui.Entity) extends dusk.entities.behave.Behave} A constructor for the specified type, 
	 *  or null if it doesn't exist.
	 * @since 0.0.18-alpha
	 */
	entities.getBehaviour = function(name) {
		if(!(name in _behaviours)) return null;
		return _behaviours[name];
	};
	
	/** Returns an object for all the current behaviours. Keys are behaviour names, values are the behaviour
	 *  constructors.
	 * @return {object} The behaviours.
	 * @since 0.0.21-alpha
	 */
	entities.getAllBehaviours = function() {
		return _behaviours;
	};
	
	/** Associates the given workshop data for a given behaviour.
	 * 
	 * See `dusk.entities.sgui.EntityWorkshop` for details on the format.
	 * @param {string} name The name of the behaviour.
	 * @param {object} data Workshop data.
	 * @since 0.0.21-alpha
	 */
	entities.registerWorkshop = function(name, data) {
		_workshop[name] = data;
	};
	
	/** Returns the workshop data for a given behaviour.
	 * @param {string} name The name of the behaviour.
	 * @return {object} Workshop data for the behaviour.
	 * @since 0.0.21-alpha
	 */
	entities.getWorkshop = function(name) {
		if(name in _workshop) return _workshop[name];
		
		return null;
	};
	
	/** Returns the workshop data for all entities that have been defined, as an object. Key is behaviour name, value
	 *  is the workshop object.
	 * @return {object} All workshop data.
	 * @since 0.0.21-alpha
	 */
	entities.getAllWorkshops = function(name) {
		return _workshop;
	};
	
	return entities;
})());
