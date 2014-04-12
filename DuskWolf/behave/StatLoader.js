//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.stats");

dusk.load.provide("dusk.behave.StatLoader");

/* @class dusk.behave.StatLoader
 * 
 * @classdesc 
 * 
 * @extends dusk.behave.Behave
 * @param {?dusk.sgui.Entity} entity The entity this behaviour is attached to.
 * @constructor
 */
dusk.behave.StatLoader = function(entity) {
	dusk.behave.Behave.call(this, entity);
	
	this._data("statsName", "", true);
	this._data("statsPutBack", false, true);
	this._data("statsLoadImage", false, true);
	
	this.entityEvent.listen(this._slLoad.bind(this), undefined, {"name":"typeChange"});
	this.entityEvent.listen(this._slSaveBM.bind(this), undefined, {"name":"saveBM"});
};
dusk.behave.StatLoader.prototype = Object.create(dusk.behave.Behave.prototype);

dusk.behave.StatLoader.prototype._slLoad = function(e) {
	if(this._data("statsName")) {
		var room = "*";
		if(this._entity.path("..")) room = this._entity.path("../..").roomName;
		
		if(dusk.stats.getStats("putback_"+room+"_"+this._entity.comName)) {
			this._entity.stats = dusk.stats.getStats("putback_"+room+"_"+this._entity.comName)
		}else{
			this._entity.stats = dusk.stats.getStats(this._data("statsName"));
			
			if(this._data("statsPutBack")) {
				dusk.stats.addStats("putback_"+room+"_"+this._entity.comName, this._entity.stats);
			}
		}
	}else{
		this._entity.stats = dusk.stats.getStats(this._entity.stats.comName);
	}
	
	if(this._data("statsLoadImage")) {
		this._entity.src = this._entity.stats.get("image");
	}
};

dusk.behave.StatLoader.prototype._slSaveBM = function(e) {
	if(this._entity.stats) {
		e.addDep(this._entity.stats.pack);
	}
};

/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
 * @static
 */
dusk.behave.StatLoader.workshopData = {
	"help":"Will load a LayeredStats instance for the entity.",
	"data":[
		["statsName", "string", "The name of the stats to load. If empty, the entity's name will be used.", "\"\""],
		["statsLoadImage", "boolean",
			"If the src of this entity will be set to the value of the stats field \"image\" at any level.", "false"]
	]
};

Object.seal(dusk.behave.StatLoader);
Object.seal(dusk.behave.StatLoader.prototype);

dusk.entities.registerBehaviour("StatLoader", dusk.behave.StatLoader);
