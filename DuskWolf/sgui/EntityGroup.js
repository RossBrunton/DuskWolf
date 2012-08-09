//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Group");

goog.provide("dusk.sgui.EntityGroup");

dusk.sgui.EntityGroup = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Group.call(this, parent, comName);
		
		this._entities = [];
		
		this._registerPropMask("tile-size", "_tsize", true);
		this._registerPropMask("sprite-size", "_ssize", true);
		
		this._cx = 0;
		this._cy = 0;
		
		this._tsize = 0;
		this._ssize = 0;
		
		this._selectedEntity = null;
		this._offsetX = 0;
		this._offsetY = 0;
		
		this._registerFrameHandler(this._entityGroupFrame);
		this._registerDrawHandler(this._entityGroupDraw);
		this._registerActionHandler("EntityGroup", this._entityGroupAction, this);
		for(var i = 48; i <= 57; i++) {
			this._registerKeyHandler(i, false, false, this._numberDrop, this);
		}
		this._registerKeyHandler(46, false, false, this._keyDel, this);
		this._registerKeyHandler(67, false, false, function(e) {if(confirm("Delete all entities?")) this.clear();}, this);
	}
};
dusk.sgui.EntityGroup.prototype = new dusk.sgui.Group();
dusk.sgui.EntityGroup.constructor = dusk.sgui.EntityGroup;

dusk.sgui.EntityGroup.prototype.className = "EntityGroup";

dusk.sgui.EntityGroup.prototype._entityGroupFrame = function(e) {
	if(events.getVar("plat.edit.active")) {
		//Editing
		if(dusk.events.getVar("etm.x") === undefined) dusk.events.setVar("etm.x", 0);
		if(dusk.events.getVar("etm.y") === undefined) dusk.events.setVar("etm.y", 0);
		
		if(this._focused) {
			dusk.events.setVar("etm.x", this._cx);
			dusk.events.setVar("etm.y", this._cy);
		}else{
			this._cx = dusk.events.getVar("etm.x");
			this._cy = dusk.events.getVar("etm.y");
		}
		
		if(this._selectedEntity){
			this._selectedEntity.x = (this._cx<<this._tsize)+this._offsetX;
			this._selectedEntity.y = (this._cy<<this._tsize)+this._offsetY;
		}
		this.bookRedraw();
	}else{
		//Call every entities' moveAndCollide function
		for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].moveAndCollide();
		
		//Call every entities' startFrame function
		for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].startFrame();
	}
};

dusk.sgui.EntityGroup.prototype._entityGroupDraw = function(c) {
	if(!this._focused) return;
	
	if(!this._selectedEntity){
		c.strokeStyle = "#00ffff";
		c.strokeRect(this._cx<<this._tsize, this._cy<<this._tsize, 1<<this._tsize, 1<<this._tsize);
		c.strokeRect((this._cx<<this._tsize)+this._offsetX-1, (this._cy<<this._tsize)+this._offsetY-1, 3, 3);
	}else{
		c.strokeStyle = "#ff00ff";
		c.strokeRect((this._cx<<this._tsize)+this._offsetX-1, (this._cy<<this._tsize)+this._offsetY-1, 3, 3);
	}
};

dusk.sgui.EntityGroup.prototype._entityGroupAction = function(e) {
	if(!events.getVar("plat.edit.active")) return;
	
	if(!this._selectedEntity){
		var entityList = this.getEntitiesHere((this._cx<<this._tsize)+this._offsetX, (this._cy<<this._tsize)+this._offsetY, null);
		if(entityList.length) this._selectedEntity = entityList[0];
	}else{
		this._selectedEntity = null;
	}
};

dusk.sgui.EntityGroup.prototype.allEntities = function() {
	return this._entities;
};

dusk.sgui.EntityGroup.prototype.getEntitiesHere = function(x, y, ignore) {
	var out = [];
	for(var c in this._components){
		if(this._components[c] != ignore && x >= this._components[c].x && x < this._components[c].x+this._components[c].prop("width") && y >= this._components[c].y && y < this._components[c].y+this._components[c].prop("height")) {
			out.push(this._components[c]);
		}
	}
	
	return out; 
};

dusk.sgui.EntityGroup.prototype.dropEntity = function(entity) {
	var dropped = this.getComponent(entity.name, "PlatEntity");
	dropped.typeChange(entity.type);
	dropped.x = entity.x;
	dropped.y = entity.y;
	this._entities.push(dropped);
	
	return dropped; 
};

dusk.sgui.EntityGroup.prototype.save = function() {
	var list = [];
	for(var i = this._entities.length-1; i >= 0; i --){
		if(this._entities[i].comName != dusk.events.getVar("plat.seek")){
			list[list.length] = {};
			list[list.length-1].name = this._entities[i].comName;
			list[list.length-1].type = this._entities[i].eProp("type");
			list[list.length-1].x = this._entities[i].x;
			list[list.length-1].y = this._entities[i].y;
		}
	}
	
	return list;
};

dusk.sgui.EntityGroup.prototype.adjustAll = function(dx, dy) {
	for(var i = this._entities.length-1; i >= 0; i --){
		this._entities[i].x += dx;
		this._entities[i].y += dy;
	}
};

dusk.sgui.EntityGroup.prototype.clear = function() {
	for(var c in this._components) {
		if(c != "blank") {
			this.deleteComponent(c);
		}
	}
	
	this._entities = [];
};

dusk.sgui.EntityGroup.prototype._upAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if(this._offsetY) this._offsetY --;
		return false;
	}
	
	this._cy --;
};

dusk.sgui.EntityGroup.prototype._downAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if(this._offsetY < 1<<this._tsize) this._offsetY ++;
		return false;
	}
	
	this._cy ++;
};

dusk.sgui.EntityGroup.prototype._leftAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if(this._offsetX) this._offsetX --;
		return false;
	}
	
	this._cx --;
};

dusk.sgui.EntityGroup.prototype._rightAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if(this._offsetX < 1<<this._tsize) this._offsetX ++;
		return false;
	}
	
	this._cx ++;
};

dusk.sgui.EntityGroup.prototype._numberDrop = function(e) {
	if(!dusk.events.getVar("plat.edit.active")) return true;
	
	var entity = {};
	entity.name = "#"+this._entities.length;
	entity.type = dusk.events.getVar("plat.edit.droppers."+(e.keyCode-48));
	entity.x = (this._cx<<this._tsize)+this._offsetX;
	entity.y = (this._cy<<this._tsize)+this._offsetY;
	this.dropEntity(entity);
	
	return false;
};

dusk.sgui.EntityGroup.prototype._keyDel = function(e) {
	if(!dusk.events.getVar("plat.edit.active") || !this._selectedEntity) return true;
	
	for(var c in this._components) {
		if(this._components[c] == this._selectedEntity) {
			this._entities.splice(this._entities.indexOf(this._components[c]), 1);
			this.deleteComponent(c);
			this._selectedEntity = null;
		}
	}
	
	return false;
};
