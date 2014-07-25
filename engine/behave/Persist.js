//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Persist", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var EventDispatcher = load.require("dusk.EventDispatcher");

	var Persist = function(entity) {
		Behave.call(this, entity);
		
		this.entityEvent.listen(this._persistFrame.bind(this), "frame");
		this.entityEvent.listen(this._persistLoad.bind(this), "typeChange");
	};
	Persist.prototype = Object.create(Behave.prototype);

	Persist.prototype._persistLoad = function(data) {
		this._entity.behaviourData = Persist.getPersist(this._entity.comName) || this._entity.behaviourData;
	};

	Persist.prototype._persistFrame = function(data) {
		Persist.storePersist(this._entity.comName, this._entity.behaviourData, this._entity.entType);
	};

	/** An event dispatcher that is fired when persistant entity data is updated.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
	 * @type dusk.EventDispatcher
	 */
	Persist.persistDataUpdate = new EventDispatcher("dusk.entities.persistDataUpdate");

	/** An object containing persistant entity data, key name is the name of the entity, while data is it's data.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
	 * @type object
	 * @private
	 */
	var _persistData = {};

	/** Stores entity data for a persistant entity.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
	 * @param {string} name The name of the entity to store data for.
	 * @param {object} data The actual data to save.
	 */
	Persist.storePersist = function(name, data, type) {
		_persistData[name] = data;
		data.entityName = name;
		data.entityType = type;
		Persist.persistDataUpdate.fire({"name":name, "data":data});
	};

	/** Returns stored entity data for a persistant entity.
	 * 
	 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
	 * @param {string} name The name of the entity to store data for.
	 * @return {object} The stored entity data for that entity.
	 */
	Persist.getPersist = function(name) {
		return _persistData[name];
	};

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

	Persist.load = function(data, type, arg, unref) {
		if(type != "data") return;
		
		for(var p in data) {
			_persistData[p] = unref(data[p]);
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Persist.workshopData = {
		"help":"Will have it's data persist accross rooms.",
		"data":[
			
		]
	};

	Object.seal(Persist);
	Object.seal(Persist.prototype);

	entities.registerBehaviour("Persist", Persist);
	
	return Persist;
})());
