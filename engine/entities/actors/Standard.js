//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** A set of actors for entities
 * 
 * @name actors
 * @namespace
 * @memberof dusk.entities
 */

load.provide("dusk.entities.actors.Standard", function() {
	var Runner = load.require("dusk.script.Runner");
	var Entity = load.require("dusk.entities.sgui.Entity");
	var utils = load.require("dusk.utils");
	
	/** Standard actors for controlling entities
	 * 
	 * Most functions here will use the "entity" property of the passed arg if their appropriate argument is the empty
	 *  string. If "which" is supplied in the options, that will be used instead of "entity".
	 * 
	 * @memberof dusk.entities.actors
	 */
	class Standard {
		/** Creates a new Standard entity actor
		 * 
		 * @param {dusk.entities.sgui.EntityGroup} entityGroup The EntityGroup containing the entities.
		 * @since 0.0.21-alpha
		 */
		constructor(entityGroup) {
			this._entityGroup = entityGroup;
		}
		
		/** Internal function for geting an entity based on the arguments to the function
		 *
		 * @private
		 * @param  {?dusk.entities.sgui.Entity|string} entity  [description]
		 * @param {object} options The options object
		 * @param {object} pa The passedArg
		 * @return {?dusk.entities.sgui.Entity} The requested entity, if it exists.
		 */
		_getEntity(entity, options, pa) {
			if(entity instanceof Entity) return entity;
			if(entity && typeof entity === "string") return this._entityGroup.get(entity);
			if(entity) throw new TypeError("Entity actor tried to act on "+entity);
			
			if("which" in options) {
				return pa[options.which];
			}else{
				return pa.entity;
			}
		}
		
		/** Given an entity which has the `dusk.entities.behave.GridWalker` behaviour will cause the entity to follow a
		 * path
		 * 
		 * The path is specified by the "path" property of the passed argument, which must be of type `dusk.tiles.Path`.
		 * 
		 * @param {?string|dusk.sgui.Entity} entity The entity on which to act
		 * @param {object} options The options object
		 * @return {object} The action to perform
		 */
		followPath(entity, options) {
			return Runner.action("dusk.entities.actors.Standard.followPath", (function(x, add) {
				return new Promise((function(fulfill, reject) {
						var ent = this._getEntity(entity, options, x);
						
						ent.eProp("gwmoves", utils.copy(x.path.dirs().reverse()));
						var oldX = ent.x;
						var oldY = ent.y;
						
						x.oldX = oldX;
						x.oldY = oldY;
						
						if(x.path.length()){ 
							var l = ent.entityEvent.listen((function(e) {
								if(!ent.eProp("gwmoves").length) {
									ent.entityEvent.unlisten(l);
									fulfill(x);
								}
							}).bind(this), "gwStopMove");
						}else{
							fulfill(x);
						}
					}).bind(this));
			}).bind(this), 
			
			(function(x) {
				var ent = this._getEntity(entity, options, x);
				
				ent.x = x.oldX;
				ent.y = x.oldY;
				
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		/** Selects an entity matching some filter function
		 * 
		 * The first entity found is set to the `entity` property of the passed arg. The `x` and `y` are set to this
		 * entity's tile coordinates, and `fullX` and `fullY` are set to the `x` and `y` values. If no entity is found,
		 * the entity property is set to null.
		 *
		 * If `target` exists in the options object, the entity will be put there instead.
		 * 
		 * @param {function(dusk.sgui.Entity):boolean} fn The filter function
		 * @param {object} options The options object
		 * @return {object} The action
		 */
		selectEntity(fn, options) {
			return Runner.action("dusk.entities.actors.Standard.selectEntity", (function(x, add) {
				var ent = this._entityGroup.filter(fn);
				if(!ent.length) {
					x[options.target?options.target:"entity"] = null;
				}else{
					x[options.target?options.target:"entity"] = ent[0];
					x.x = ent[0].tileX();
					x.y = ent[0].tileY();
					x.fullX = ent[0].x;
					x.fullY = ent[0].y;
				}
				
				return x;
			}).bind(this));
		}
		
		
		/** Selects a list of entities matching some filter function
		 * 
		 * The filtered list will be stored in the `entities` property of the passed arg.
		 *
		 * If `target` exists in the options object, the entity list will be put there instead.
		 * 
		 * @param {function(dusk.sgui.Entity):boolean} fn The filter function
		 * @param {object} options The options object
		 * @return {object} The action
		 */
		selectEntities(fn, options) {
			return Runner.action("dusk.entities.actors.Standard.selectEntities", (function(x, add) {
				x[options.target?options.target:"entities"] = this._entityGroup.filter(fn);
				
				return x;
			}).bind(this));
		}
		
		/** Sets an entity property to a given value from the passed arg
		 * 
		 * By default, the value to set is the value with the same name on the passed arg, but if `which` is specified
		 *  on the options object, the property with that name will be used instead. If the options object has a
		 *  property `value`, that will be used instead of reading from the passed arg.
		 * 
		 * The previous value of the property will be put on the `oldProp` property of the passed arg.
		 * 
		 * @param {?string|dusk.entities.sgui.Entity} Entity the entity to change
		 * @param {string} The property to write
		 * @param {object} options The optionts object
		 * @return {object} The action
		 */
		setProp(entity, prop, options) {
			return Runner.action("dusk.entities.actors.Standard.setProp", (function(x, add) {
				var ent = this._getEntity(entity, options, x);
				var val;
				
				if("value" in options) {
					val = options.value;
				}else{
					val = x[options.which?options.which:prop];
				}
				
				x.oldProp = ent.eProp(prop);
				ent.eProp(prop, val);
				
				return x;
			}).bind(this), 
			
			(function(x) {
				var ent = this._getEntity(entity, options, x);
				
				ent.eProp(prop, x.oldProp);
				
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
		
		/** Gets an entity property
		 * 
		 * By default, the value to get is stored in the value with the same name on the passed arg, but if `target` is
		 *  specified on the options object, the property with that name will be written to instead.
		 * 
		 * @param {?string|dusk.entities.sgui.Entity} Entity the entity to change
		 * @param {string} The property to write
		 * @param {object} options The optionts object
		 * @return {object} The action
		 */
		getProp(entity, prop, options) {
			return Runner.action("dusk.entities.actors.Standard.getProp", (function(x, add) {
				var ent = this._getEntity(entity, options, x);
				
				x[options.target?options.target:prop] = ent.eProp(prop);
				
				return x;
			}).bind(this));
		}
		
		/** Performs an entity animation
		 * 
		 * The name of the animation to play is given by the argument, if the argument is empty, then the `animaiton`
		 *  property of the passed arg will be used. If `which` is defined on `options`, then that is the key to use
		 *  instead of `animation`.
		 *
		 * The return value from the animation call will be set to the `animationReturn` property of the passed arg.
		 * 
		 * @param {?string|dusk.entities.sgui.Entity} Entity the entity to change
		 * @param {string} The property to write
		 * @param {object} options The optionts object
		 * @return {object} The action
		 */
		animate(entity, animation, options) {
			return Runner.action("dusk.entities.actors.Standard.animate", (function(x, add) {
				var ent = this._getEntity(entity, options, x);
				
				if(!animation) {
					animation = x[options.which?options.which:"animation"];
				}
				
				return ent.animate(animation).then(function(ret) {x.animationReturn = ret; return x;});
			}).bind(this));
		}
		
		/** Terminates the entity.
		 * 
		 * This cannot be inversed, watch out.
		 * 
		 * @param {?string|dusk.entities.sgui.Entity} Entity the entity to change
		 * @param {string} The property to write
		 * @param {object} options The optionts object
		 * @return {object} The action
		 */
		terminate(entity, options) {
			return Runner.action("dusk.entities.actors.Standard.terminate", (function(x, add) {
				var ent = this._getEntity(entity, options, x);
				
				return ent.terminate().then(function(ret) {return x;});
			}).bind(this),
		
			function(x) {
				return Promise.reject(new Runner.CannotInverseError("Tried to inverse terminating an entity"));
			});
		}
	}
	
	return Standard;
});
