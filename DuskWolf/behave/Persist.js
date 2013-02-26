//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.entities");

dusk.load.provide("dusk.behave.Persist");

dusk.behave.Persist = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this.entityEvent.listen(this._persistFrame, this, {"name":"frame"});
		this.entityEvent.listen(this._persistLoad, this, {"name":"typeChange"});
	}
};
dusk.behave.Persist.prototype = new dusk.behave.Behave();
dusk.behave.Persist.constructor = dusk.behave.Persist;

dusk.behave.Persist.prototype._persistLoad = function(data) {
	this._entity.behaviourData = dusk.entities.getPersist(this._entity.comName) || this._entity.behaviourData;
};

dusk.behave.Persist.prototype._persistFrame = function(data) {
	dusk.entities.storePersist(this._entity.comName, this._entity.behaviourData);
};
