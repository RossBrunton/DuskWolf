//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.stats.behave.StatLoader", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");
	var stats = load.require("dusk.stats");

	/* @class dusk.stats.behave.StatLoader
	 * 
	 * @classdesc 
	 * 
	 * @extends dusk.entities.behave.Behave
	 * @param {?dusk.entities.sgui.Entity} entity The entity this behaviour is attached to.
	 * @constructor
	 */
	var StatLoader = function(entity) {
		Behave.call(this, entity);
		
		this._data("statsName", "", true);
		this._data("statsPutBack", false, true);
		this._data("statsLoadImage", false, true);
		
		this.entityEvent.listen(this._slLoad.bind(this), "typeChange");
		this.entityEvent.listen(this._slSaveBM.bind(this), "saveBM");
	};
	StatLoader.prototype = Object.create(Behave.prototype);

	StatLoader.prototype._slLoad = function(e) {
		if(this._data("statsName")) {
			var room = "*";
			if(this._entity.path("..")) room = this._entity.path("../..").roomName;
			
			if(stats.getStats("putback_"+room+"_"+this._entity.name)) {
				this._entity.stats = stats.getStats("putback_"+room+"_"+this._entity.name)
			}else{
				this._entity.stats = stats.getStats(this._data("statsName"));
				
				if(this._data("statsPutBack")) {
					stats.addStats("putback_"+room+"_"+this._entity.name, this._entity.stats);
				}
			}
		}else{
			this._entity.stats = stats.getStats(this._entity.stats.name);
		}
		
		if(this._data("statsLoadImage")) {
			this._entity.src = this._entity.stats.get("image");
		}
	};

	StatLoader.prototype._slSaveBM = function(e) {
		if(this._entity.stats) {
			e.addDep(this._entity.stats.pack);
		}
	};

	/** Workshop data used by `{@link dusk.entities.sgui.EntityWorkshop}`.
	 * @static
	 */
	StatLoader.workshopData = {
		"help":"Will load a LayeredStats instance for the entity.",
		"data":[
			["statsName", "string", "The name of the stats to load. If empty, the entity's name will be used.", "\"\""],
			["statsLoadImage", "boolean",
				"If the src of this entity will be set to the value of the stats field \"image\" at any level.", "false"]
		]
	};

	Object.seal(StatLoader);
	Object.seal(StatLoader.prototype);

	entities.registerBehaviour("StatLoader", StatLoader);
	
	return StatLoader;
})());
