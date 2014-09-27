//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Behave", (function() {
	var Entity = load.require(">dusk.entities.sgui.Entity", function(p) {Entity = p});
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var entities = load.require("dusk.entities");
	
	/** A behaviour of an entity.
	 * 
	 * Objects of this class, and it's subclasses, are "attached" to `{@link dusk.entities.sgui.Entity}` instances and
	 *  essentially provide details on how the entity should act.
	 * 
	 * This class is the base class of these behaviours, but does nothing on it's own.
	 * 
	 * Entities may have multiple behaviours, but each behaviour instance can only be attached to one entity.
	 * 
	 * Messages are passed to the behaviour using `{@link dusk.entities.sgui.Entity.behaviourFire}`, which fires an event. The
	 * behaviour itself should edit the entity's public properties directly.
	 * 
	 * @param {dusk.entities.sgui.Entity} entity The entity this behaviour will act with.
	 * @constructor
	 */
	var Behave = function(entity) {
		/** The entitiy this behaviour is acting on.
		 * @type dusk.entities.sgui.Entity
		 * @protected
		 */
		this._entity = entity;
		
		/** An event dispatcher that is fired when the entity's `{@link dusk.entities.sgui.Entity.behaviourFire}` method is called.
		 * 
		 * The properties of the event object will vary depending on it's type, but there will always be a `name` property
		 * which contains the name of the event fired.
		 * @type dusk.utils.EventDispatcher
		 */
		this.entityEvent = new EventDispatcher("dusk.entities.behave.Behave.entityEvent");
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
		return this._entity.eProp(name, value, init);
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
	 * @protected
	 */
	Behave.prototype._controlActive = function(name) {
		return this._entity.controlActive(name);
	};
	
	return Behave;
})());
