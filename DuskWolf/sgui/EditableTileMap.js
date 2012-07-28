//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.TileMap");

goog.provide("dusk.sgui.EditableTileMap");

/**
 */
sgui.EditableTileMap = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.TileMap.call(this, parent, events, comName);
		
		this._registerPropMask("cursorColour", "_cursorColour", true);
		this._registerPropMask("cursorColor", "_cursorColour", true);
		this._registerPropMask("globalCoords", "_globalCoords", true);
		
		this._globalCoords = this._theme("etm.globalCoords", false);
		
		this._cx = 0;
		this._cy = 0;
		
		this._registerDrawHandler(this._editTileMapDraw);
		this._registerFrameHandler(this._editTileMapFrame);
	}
};
sgui.EditableTileMap.prototype = new sgui.TileMap();
sgui.EditableTileMap.constructor = sgui.EditableTileMap;

sgui.EditableTileMap.prototype.className = "EditableTileMap";

sgui.EditableTileMap.prototype._editTileMapDraw = function(c) {
	if(!this._focused) return;
	c.strokeStyle = this.prop("cursorColour");
	c.strokeRect(this._cx*this.tileWidth(), this._cy*this.tileHeight(), this.tileWidth(), this.tileHeight());
};

sgui.EditableTileMap.prototype._editTileMapFrame = function(e) {
	if(dusk.events.getVar("etm.x") === undefined) dusk.events.setVar("etm.x", 0);
	if(dusk.events.getVar("etm.y") === undefined) dusk.events.setVar("etm.y", 0);
	
	if(this._focused) {
		dusk.events.setVar("etm.x", this._cx);
		dusk.events.setVar("etm.y", this._cy);
	}else{
		this._cx = dusk.events.getVar("etm.x");
		this._cy = dusk.events.getVar("etm.y");
	}
};

sgui.EditableTileMap.prototype._upAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[1] --;
		this.setTile(this._cx, this._cy, current[0], current[1], true);
		this.bookRedraw();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")+0.1 >= 1) {this.prop("alpha", 1)} else {this.prop("alpha", this.prop("alpha")+0.1);}
		return false;
	}
	
	this._cy --;
	this.bookRedraw();
};

sgui.EditableTileMap.prototype._downAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[1] ++;
		this.setTile(this._cx, this._cy, current[0], current[1], true);
		this.bookRedraw();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")-0.1 <= 0) {this.prop("alpha", 0)} else {this.prop("alpha", this.prop("alpha")-0.1);}
		return false;
	}
	
	this._cy ++;
	this.bookRedraw();
};

sgui.EditableTileMap.prototype._rightAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[0] ++;
		this.setTile(this._cx, this._cy, current[0], current[1], true);
		this.bookRedraw();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")+0.1 >= 1) {this.prop("alpha", 1)} else {this.prop("alpha", this.prop("alpha")+0.1);}
		return false;
	}
	
	this._cx ++;
	this.bookRedraw();
};

sgui.EditableTileMap.prototype._leftAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[0] --;
		this.setTile(this._cx, this._cy, current[0], current[1], true);
		this.bookRedraw();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")-0.1 <= 0) {this.prop("alpha", 0)} else {this.prop("alpha", this.prop("alpha")-0.1);}
		return false;
	}
	
	this._cx --;
	this.bookRedraw();
};
