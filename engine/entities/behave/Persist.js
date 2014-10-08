//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.behave.Persist", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** Saves and loads behaviour data, making the entity persistent.
	 * 
	 * When loading, this tries to receive stored persist data for an entity using its component name, and if it exists
	 *  will overwrite it's behaviour data with it. Every frame it tries to save its behaviour data to this persist data
	 *  slot. This means that the behaviour data will essentially be preserved when this entity is destroyed and
	 *  recreated. 
	 * 
	 * This behaviour does not use any behaviour properties.
	 * 
	 * @param {dusk.entities.sgui.Entity} entity The entity this behaviour will act with.
	 * @implements dusk.save.ISavable
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var Persist = function(entity) {
		Behave.call(this, entity);
		
		this.entityEvent.listen(_frame.bind(this), "frame");
		this.entityEvent.listen(_load.bind(this), "typeChange");
	};
	Persist.prototype = Object.create(Behave.prototype);
	
	/** Used to handle entity loading; to restore the persistent data.
	 * @param {object} data The event object.
	 * @private
	 */
	var _load = function(data) {
		this._entity.behaviourData = Persist.getPersist(this._entity.name) || this._entity.behaviourData;
	};
	
	/** Used to handle ever frame; saving the data.
	 * @param {object} data The event object.
	 * @private
	 */
	var _frame = function(data) {
		_storePersist(this._entity.name, this._entity.behaviourData, this._entity.entType);
	};
	
	/** An event dispatcher that is fired when persistent entity data is updated.
	 * 
	 * The event object has two properties; `name` and `data`. `data` is the persist data that has been updated, and
	 *  `name` is the name of the entity.
	 * 
	 * @type dusk.utils.EventDispatcher
	 */
	Persist.persistDataUpdate = new EventDispatcher("dusk.entities.persistDataUpdate");
	
	/** An object containing persistent entity data, key name is the name of the entity, while data is its data.
	 * 
	 * @type object
	 * @private
	 */
	var _persistData = {};
	
	/** Stores entity data for a persistent entity.
	 * 
	 * @param {string} name The name of the entity to store data for.
	 * @param {object} data The actual data to save.
	 * @param {string} type The entity type.
	 */
	var _storePersist = function(name, data, type) {
		_persistData[name] = data;
		data.entityName = name;
		data.entityType = type;
		Persist.persistDataUpdate.fire({"name":name, "data":data});
	};
	
	/** Returns stored entity data for a persistent entity.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistent entities.
	 * @param {string} name The name of the entity to store data for.
	 * @return {object} The stored entity data for that entity.
	 */
	Persist.getPersist = function(name) {
		return _persistData[name];
	};
	
	
	/** Saves the persistent data.
	 * 
	 * The arg must be an object which may contain the following keys:
	 * - names:array - An array of entity names; only these will be saved.
	 * - types:array - An arary of entity type names; only these will be saved.
	 * 
	 * Specifying both names and types will save both sets of data, rather than the intersection.
	 * 
	 * @param {string} type The type of thing to save; must be `"data"`.
	 * @param {array} arg The argument to the save, as described above.
	 * @param {function(*):integer|array} The reffing function.
	 * @return {object} Save data that can be loaded later.
	 */
	Persist.save = function(type, arg, ref) {
		if(type !== "data") return {};
		
		var out = {};
		
		if(!("names" in arg) && !("types" in arg)) {
			for(var p in _persistData) {
				out[p] = ref(_persistData[p]);
			}
		}else{
			if("names" in arg) {
				for(var i = arg.names.length-1; i >= 0; i --) {
					out[arg.names[i]] = ref(_persistData[arg.names[i]]);
				}
			}
			
			if("types" in arg) {
				for(var p in this._persistData) {
					if(arg.types.indexOf(_persistData[p].entityType) != -1) {
						out[p] = ref(_persistData[p]);
					}
				}
			}
		}
		
		return out;
	};
	
	/** Restores data that was saved via `save`.
	 * 
	 * @param {object} data The data that was saved.
	 * @param {string} type The type of data that was saved.
	 * @param {array} arg The argument that was used in saving.
	 * @param {function(array|integer):*} The unreffing function.
	 * @since 0.0.21-alpha
	 */
	Persist.load = function(data, type, arg, unref) {
		if(type != "data") return;
		
		for(var p in data) {
			_persistData[p] = unref(data[p]);
		}
	};
	
	/** Workshop data used by `dusk.entities.sgui.EntityWorkshop`.
	 * @static
	 */
	Persist.workshopData = {
		"help":"Will have it's data persist accross rooms.",
		"data":[
			
		]
	};
	
	entities.registerBehaviour("Persist", Persist);
	
	return Persist;
})());
