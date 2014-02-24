//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.entities");

dusk.load.provide("dusk.behave.Persist");

dusk.behave.Persist = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this.entityEvent.listen(this._persistFrame, this, {"name":"frame"});
	this.entityEvent.listen(this._persistLoad, this, {"name":"typeChange"});
};
dusk.behave.Persist.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.Persist.prototype._persistLoad = function(data) {
	this._entity.behaviourData = dusk.behave.Persist.getPersist(this._entity.comName) || this._entity.behaviourData;
};

dusk.behave.Persist.prototype._persistFrame = function(data) {
	dusk.behave.Persist.storePersist(this._entity.comName, this._entity.behaviourData, this._entity.entType);
};

/** An event dispatcher that is fired when persistant entity data is updated.
 * 
 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
 * @type dusk.EventDispatcher
 */
dusk.behave.Persist.persistDataUpdate = new dusk.EventDispatcher("dusk.entities.persistDataUpdate");

/** An object containing persistant entity data, key name is the name of the entity, while data is it's data.
 * 
 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
 * @type object
 * @private
 */
dusk.behave.Persist._persistData = {};

/** Stores entity data for a persistant entity.
 * 
 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
 * @param {string} name The name of the entity to store data for.
 * @param {object} data The actual data to save.
 */
dusk.behave.Persist.storePersist = function(name, data, type) {
	this._persistData[name] = data;
	data.entityName = name;
	data.entityType = type;
	this.persistDataUpdate.fire({"name":name, "data":data});
};

/** Returns stored entity data for a persistant entity.
 * 
 * See `{@link dusk.behaviours.Persist}` for details on persistant entities.
 * @param {string} name The name of the entity to store data for.
 * @return {object} The stored entity data for that entity.
 */
dusk.behave.Persist.getPersist = function(name) {
	return this._persistData[name];
};

dusk.behave.Persist.save = function(type, arg) {
	if(type !== "data") return {};
	
	var out = {};
	
	if(!("names" in arg) && !("types" in arg)) {
		for(var p in this._persistData) {
			out[p] = this._persistData[p];
		}
	}else{
		if("names" in arg) {
			for(var i = arg.names.length-1; i >= 0; i --) {
				out[arg.names[i]] = this._persistData[arg.names[i]];
			}
		}
		
		if("types" in arg) {
			for(var p in this._persistData) {
				if(arg.types.indexOf(this._persistData[p].entityType) != -1) {
					out[p] = this._persistData[p];
				}
			}
		}
	}
	
	return out;
};

dusk.behave.Persist.load = function(data, type, arg) {
	if(type != "data") return;
	
	for(var p in data) {
		this._persistData[p] = data[p];
	}
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.Persist.workshopData = {
	"help":"Will have it's data persist accross rooms.",
	"data":[
		
	]
};

Object.seal(dusk.behave.Persist);
Object.seal(dusk.behave.Persist.prototype);

dusk.entities.registerBehaviour("Persist", dusk.behave.Persist);
