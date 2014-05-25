//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Behave", (function() {
	var Entity = load.require(">dusk.sgui.Entity", function(p) {Entity = p});
	var EventDispatcher = load.require("dusk.EventDispatcher");
	var entities = load.require("dusk.entities");
	
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
	 * Objects of this class, and it's subclasses, are "attached" to `{@link dusk.sgui.Entity}` instances and essentially
	 * provide details on how the entity should act.
	 * 
	 * This class is the base class of these behaviours, but does nothing on it's own.
	 * 
	 * Entities may have multiple behaviours, but each behaviour instance can only be attached to one entity.
	 * 
	 * Messages are passed to the behaviour using `{@link dusk.sgui.Entity.behaviourFire}`, which fires an event. The
	 * behaviour itself should edit the entity's public properties directly.
	 * 
	 * @param {dusk.sgui.Entity} entity The entity this behaviour will act with.
	 * @constructor
	 */
	var Behave = function(entity) {
		/** The entitiy this behaviour is acting on.
		 * @type dusk.sgui.Entity
		 * @protected
		 */
		this._entity = entity;
		
		/** An event dispatcher that is fired when the entity's `{@link dusk.sgui.Entity.behaviourFire}` method is called.
		 * 
		 * The properties of the event object will vary depending on it's type, but there will always be a `name` property
		 * which contains the name of the event fired.
		 * @type dusk.EventDispatcher
		 */
		this.entityEvent = new EventDispatcher("dusk.behave.Behave.entityEvent", EventDispatcher.MODE_LAST);
	};

	/** This accesses or sets behaviour data of the entity.
	 * 
	 * Behaviour data is data that is used by a behaviours, and is shared between all of them. It is also saved and loaded
	 * with the entitiy and generally "represents" it.
	 * @param {string} name The key of the data you want to access.
	 * @param {*} value The value to set, unless `init` is true and a value has already been set.
	 * @param {boolean} init If true, then only if the data specified with the key is undefined, it will be set.
	 * @return {*} The value of the data specified with the `name`.
	 * @protected
	 */
	Behave.prototype._data = function(name, value, init) {
		if(init && value !== undefined) {
			if(!(name in this._entity.behaviourData)) this._entity.behaviourData[name] = value;
		}else if(value !== undefined) {
			this._entity.behaviourData[name] = value;
		}
		
		return this._entity.behaviourData[name];
	};

	/** Returns true if the specified control is active.
	 * 
	 * Entities should listen for the "controlActive" event, whose object has the property "control"; the name of the
	 *  control. Any of these listeners returning true will mean the control is active.
	 * 
	 * If the control is in an entity data array "controlsOn", this will always return true, as well.
	 * 
	 * @param {string} name The name of the control to check.
	 * @return {boolean} Whether the control is activated or not.
	 * @protected
	 */
	Behave.prototype._controlActive = function(name) {
		if(this._data("controlsOn") && this._data("controlsOn").indexOf(name) !== -1) {
			return true;
		}
		
		if(this._entity.behaviourFireWithReturn("controlActive", {"control":name}).indexOf(true) !== -1) {
			return true;
		}
		
		return false;
	};

	Object.seal(Behave);
	Object.seal(Behave.prototype);
	
	return Behave;
})());
