//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.Persist");

dusk.pbehave.Persist = function(entity) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity);
		
		this._listenEvent("typeChange", this._persistLoad);
		this._listenEvent("frame", this._persistFrame);
	}
};
dusk.pbehave.Persist.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.Persist.constructor = dusk.pbehave.Persist;

dusk.pbehave.Persist.prototype._persistLoad = function(name, data) {
	this._entity.behaviourData = dusk.mods.plat.getPersist(this._entity.comName) || this._entity.behaviourData;
};

dusk.pbehave.Persist.prototype._persistFrame = function(name, data) {
	dusk.mods.plat.storePersist(this._entity.comName, this._entity.behaviourData);
};
