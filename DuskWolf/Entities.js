//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk.entities");

/** @namespace dusk.entities
 * @name dusk.entities
 * 
 * @description This manages entities.
 * 
 * @since 0.0.16-alpha
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
dusk.entities._init = function() {
	/** Sprite size of binary entities and tilemap tiles.
	 * 
	 * If the mode is binary, then this is considered to be the width and height of the tiles when reading them from the image.
	 * 
	 * This should be `n` such that the width and height of the sprite is `2^n`. If this is 4, then the sprites will be 16x16, for example.
	 * 
	 * @type integer
	 * @default 4
	 */
	dusk.entities.ssize = 4;
	/** Sprite width of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the width of tiles when reading them from the image.
	 * 
	 * @type integer
	 * @default 16
	 */
	this.swidth = 16;
	/** Sprite height of decimal entities and tilemap tiles.
	 * 
	 * If the mode is decimal, then this is the height of tiles when reading them from the image.
	 * 
	 * @type number
	 * @default 16
	 */
	this.sheight = 16;
	
	/** Tile size of binary entities and tilemap tiles.
	 * 
	 * If the mode is binary, then this is considered to be the width and height of the tiles when drawing them to the canvas.
	 * 
	 * This should be `n` such that the width and height of the tile to draw is `2^n`. If this is 4, then the sprites will be 16x16, for example.
	 * 
	 * @type integer
	 * @default 5
	 */
	this.tsize = 5;
	this.twidth = 32;
	this.theight = 32;
	
	this.mode = "BINARY";
	
	this.seek = "hero";
	this.seekType = "player";
	
	this.markTrigger = new dusk.EventDispatcher("dusk.entities.markTrigger");
	this.persistDataUpdate = new dusk.EventDispatcher("dusk.entities.persistDataUpdate");
	
	this._persistData = {};
	
	this._entityData = {};
	this._entityData["default"] = {
		"data":{},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	};
};

dusk.entities.modifyEntityType = function(name, data, inherit) {
	if(inherit !== undefined) {
		this._entityData[name] = dusk.utils.merge(this._entityData[inherit], data);
	}else if(!(name in this._entityData)) {
		this._entityData[name] = dusk.utils.merge(this._entityData["default"], data);
	}else{
		this._entityData[name] = dusk.utils.merge(this._entityData[name], data);
	}
};

dusk.entities.getEntityType = function(name) {
	return this._entityData[name];
};

dusk.entities.storePersist = function(name, data) {
	this._persistData[name] = data;
	data.entityName = name;
	this.persistDataUpdate.fire(data);
};

dusk.entities.getPersist = function(name) {
	return this._persistData[name];
};

dusk.entities._init();
