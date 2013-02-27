//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.sgui.Entity");
dusk.load.require(">dusk.EventDispatcher");

dusk.load.provide("dusk.behave.Behave");

/** @namespace dusk.behave
 * 
 * @description This is the namespace with all the Entity behaviours in it.
 * 
 * See `{@link dusk.behave.Behave}` for a description on what a behviour is.
 */

/** @class dusk.behave.Behave
 * 
 * @classdesc A behaviour of an entity.
 * 
 * Object of this class, and it's subclasses, are "attached" to `{@link dusk.sgui.Entity}` instances, and essentially provide behaviours.
 * 
 * This class is the base class of these behaviours, but does nothing on it's own.
 * 
 * Entities may have multiple behaviours, but each behaviour instance can only be attached to one entity.
 * 
 * Messages are passed to the behaviour using `{@link dusk.sgui.Entity.behaviourFire}`, which fires an event.
 * 	The behaviour itself should edit the entity's public properties directly.
 * 
 * @param {dusk.sgui.Entity} entity The entity this behaviour will act with.
 * @constructor
 */
dusk.behave.Behave = function(entity) {
	/** The entitiy this behaviour is acting on.
	 * @type dusk.sgui.Entity
	 * @protected
	 */
	this._entity = entity;
	
	/** An event dispatcher that is fired when the entity's `{@link dusk.sgui.Entity.behaviourFire}` method is called.
	 * 
	 * The properties of the event object will vary depending on it's type, but there will always be a `name` property which contains the name of the event fired.
	 * @type dusk.EventDispatcher
	 */
	this.entityEvent = new dusk.EventDispatcher("dusk.behave.Behave.entityEvent", dusk.EventDispatcher.MODE_LAST);
};

/** This accesses or sets behaviour data of the entity.
 * 
 * Behaviour data is data that should only be used by a behaviour, but is shared between all behaviours.
 * @param {string} name The key of the data you want to access.
 * @param {*} value The value to set, unless `init` is true and the data is defined, this will set the specified key to this value.
 * @param {boolean} init If true, then only if the data specified with the key is undefined, then it will be set with the value.
 * @return {*} The value of the data specified with the `name`.
 * @protected
 */
dusk.behave.Behave.prototype._data = function(name, value, init) {
	if(init && value !== undefined) {
		if(!(name in this._entity.behaviourData)) this._entity.behaviourData[name] = value;
	}else if(value !== undefined) {
		this._entity.behaviourData[name] = value;
	}
	
	return this._entity.behaviourData[name];
};