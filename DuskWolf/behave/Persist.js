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
	dusk.behave.Persist.storePersist(this._entity.comName, this._entity.behaviourData);
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
dusk.behave.Persist.storePersist = function(name, data) {
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
dusk.behave.Persist.getPersist = function(name) {
	return this._persistData[name];
};

dusk.behave.Persist.workshopData = {
	"help":"Will have it's data persist accross rooms.",
	"data":[
		
	]
};

Object.seal(dusk.behave.Persist);
Object.seal(dusk.behave.Persist.prototype);

dusk.entities.registerBehaviour("Persist", dusk.behave.Persist);
