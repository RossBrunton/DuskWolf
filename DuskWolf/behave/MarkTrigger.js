//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.MarkTrigger", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var TileMap = load.require("dusk.sgui.TileMap");

	var MarkTrigger = function(entity) {
		Behave.call(this, entity);
		
		this._markAt = "";
		this._coolDown = 5;
		
		var t = this._entity.scheme && this._entity.scheme.tilePointIn(
			this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
		);
		
		if(t && t[1] == 1) {
			this._markAt = t[0];
		}
		
		if(t) dusk.sgui.TileMap.tileData.free(t);
		
		this.entityEvent.listen(this._markTriggerFrame, this, {"name":"frame"});
	};
	MarkTrigger.prototype = Object.create(Behave.prototype);

	MarkTrigger.prototype._markTriggerFrame = function(name, e) {
		if(this._coolDown) this._coolDown --;
		
		if(!this._entity.scheme) return;
		
		var t = this._entity.scheme.tilePointIn(
			this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
		);
		
		if(t[1] != 1) {
			this._markAt = -1;
		}
		
		if(t[1] == 1 && t[0] != this._markAt
		) {
			this._markAt = t[0];
			
			if(!this._coolDown) {
				entities.markTrigger.fire({
					"up":false, "mark":this._markAt, "activator":this._entity.comName, "entity":this._entity,
					"room":this._entity.path("../..").roomName
				});
				this._coolDown = 5;
			}
		}
		
		TileMap.tileData.free(t);
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	MarkTrigger.workshopData = {
		"help":"Will trigger marks on the scheme layer.",
		"data":[
			
		]
	};

	Object.seal(MarkTrigger);
	Object.seal(MarkTrigger.prototype);

	entities.registerBehaviour("MarkTrigger", MarkTrigger);
	
	return MarkTrigger;
})());
