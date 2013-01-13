//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.plat");

dusk.load.provide("dusk.behave.Persist");

dusk.behave.Persist = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._listenEvent("typeChange", this._persistLoad);
		this._listenEvent("frame", this._persistFrame);
	}
};
dusk.behave.Persist.prototype = new dusk.behave.Behave();
dusk.behave.Persist.constructor = dusk.behave.Persist;

dusk.behave.Persist.prototype._persistLoad = function(name, data) {
	this._entity.behaviourData = dusk.plat.getPersist(this._entity.comName) || this._entity.behaviourData;
};

dusk.behave.Persist.prototype._persistFrame = function(name, data) {
	dusk.plat.storePersist(this._entity.comName, this._entity.behaviourData);
};
