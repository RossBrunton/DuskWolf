//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.actors.Standard", (function() {
	var Runner = load.require("dusk.script.Runner");
	var Entity = load.require("dusk.entities.sgui.Entity");
	var utils = load.require("dusk.utils");
	
	/** Standard actors for controlling entities
	 * 
	 * Most functions here will use the "entity" property of the passed arg if their appropriate argument is the empty
	 *  string. If "which" is supplied in the options, that will be used instead of "entity".
	 * 
	 * @param {dusk.entities.sgui.EntityGroup} entityGroup The EntityGroup containing the entities.
	 * @since 0.0.21-alpha
	 */
	var Standard = function(entityGroup){
		this._entityGroup = entityGroup;
	};
	
	/** Internal function for geting an entity based on the arguments to the function
	 *
	 * @private
	 * @param  {?dusk.entities.sgui.Entity|string} entity  [description]
	 * @param  {object} options The options object
	 * @param  {object} pa The passedArg
	 * @return {?dusk.entities.sgui.Entity} The requested entity, if it exists.
	 */
	Standard.prototype._getEntity = function(entity, options, pa) {
		if(entity instanceof Entity) return entity;
		if(entity && typeof entity === "string") return this._entityGroup.get(entity);
		if(entity) throw new TypeError("Entity actor tried to act on "+entity);
		
		if("which" in options) {
			return pa[options.which];
		}else{
			return pa.entity;
		}
	}
	
	/** Given an entity which has the `dusk.entities.behave.GridWalker` behaviour will cause the entity to follow a path
	 * 
	 * The path is specified by the "path" property of the passed argument, which must be of type `dusk.tiles.Path`.
	 * 
	 * @param  {?string|dusk.sgui.Entity} entity The entity on which to act
	 * @param  {object} options The options object
	 * @return {object} The action to perform
	 */
	Standard.prototype.followPath = function(entity, options) {
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
	};
	
	/** Selects an entity matching some filter function
	 * 
	 * The first entity found is set to the `entity` property of the passed arg. The `x` and `y` are set to this
	 * entity's tile coordinates, and `fullX` and `fullY` are set to the `x` and `y` values. If no entity is found, the
	 * entity property is set to null.
	 *
	 * If `target` exists in the options object, the entity will be put there instead.
	 * 
	 * @param  {function(dusk.sgui.Entity):boolean} fn The filter function
	 * @param  {object} options The optionts object
	 * @return {object} The action
	 */
	Standard.prototype.selectEntity = function(fn, options) {
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
		}).bind(this), 
		
		(function(x) {
			return Promise.reject(new Runner.Cancel());
		}).bind(this));
	}
	
	
	/** Selects a list of entities matching some filter function
	 * 
	 * The filtered list will be stored in the `entities` property of the passed arg.
	 *
	 * If `target` exists in the options object, the entity list will be put there instead.
	 * 
	 * @param  {function(dusk.sgui.Entity):boolean} fn The filter function
	 * @param  {object} options The optionts object
	 * @return {object} The action
	 */
	Standard.prototype.selectEntities = function(fn, options) {
		return Runner.action("dusk.entities.actors.Standard.selectEntities", (function(x, add) {
			x[options.target?options.target:"entities"] = this._entityGroup.filter(fn);
			
			return x;
		}).bind(this), 
		
		(function(x) {
			return Promise.reject(new Runner.Cancel());
		}).bind(this));
	}
	
	return Standard;
})());
