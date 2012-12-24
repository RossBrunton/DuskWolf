//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");

dusk.load.provide("dusk.sgui.EntityGroup");

dusk.sgui.EntityGroup = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Group.call(this, parent, comName);
		
		this._entities = [];
		
		this._cx = 0;
		this._cy = 0;
		
		this.tsize = 0;
		this.twidth = 0;
		this.theight = 0;
		
		this.ssize = 0;
		this.sheight = 0;
		this.swidth = 0;
		
		this.mode = "";
		
		this._selectedEntity = null;
		this._offsetX = 0;
		this._offsetY = 0;
		
		this._registerPropMask("mode", "mode", "BINARY");
		
		this._registerPropMask("sprite-size", "ssize", true);
		this._registerPropMask("sprite-height", "sheight", true);
		this._registerPropMask("sprite-width", "swidth", true);
		
		this._registerPropMask("tile-size", "tsize", true);
		this._registerPropMask("tile-height", "theight", true);
		this._registerPropMask("tile-width", "twidth", true);
		
		this._registerDrawHandler(this._entityGroupDraw);
		this._registerActionHandler("EntityGroup", this._entityGroupAction, this);
		
		for(var i = 48; i <= 57; i++) {
			this._registerKeyHandler(i, false, false, this._numberDrop, this);
		}
		this._registerKeyHandler(46, false, false, this._keyDel, this);
		this._registerKeyHandler(67, false, false, function(e) {if(dusk.mods.plat.editing && confirm("Delete all entities?")) this.clear();}, this);
	}
	
	window.hook = this;
};
dusk.sgui.EntityGroup.prototype = new dusk.sgui.Group();
dusk.sgui.EntityGroup.constructor = dusk.sgui.EntityGroup;

dusk.sgui.EntityGroup.prototype.className = "EntityGroup";

dusk.sgui.EntityGroup.prototype.doFrame = function() {
	if(dusk.mods.plat.editing) {
		//Editing
		if(this._focused) {
			dusk.sgui.EditableTileMap.globalEditX = this._cx;
			dusk.sgui.EditableTileMap.globalEditY = this._cy;
		}else{
			this._cx = dusk.sgui.EditableTileMap.globalEditX;
			this._cy = dusk.sgui.EditableTileMap.globalEditY;
		}
		
		if(this._selectedEntity){
			if(this.mode == "BINARY") {
				this._selectedEntity.x = (this._cx<<this.tsize)+this._offsetX;
				this._selectedEntity.y = (this._cy<<this.tsize)+this._offsetY;
			}else{
				this._selectedEntity.x = (this._cx*this.twidth)+this._offsetX;
				this._selectedEntity.y = (this._cy*this.theight)+this._offsetY;
			}
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
	if(!dusk.mods.plat.editing) return;
	if(!this._focused) return;
	
	if(!this._selectedEntity){
		c.strokeStyle = "#00ffff";
		if(this.mode == "BINARY") {
			c.strokeRect(this._cx<<this.tsize, this._cy<<this.tsize, 1<<this.tsize, 1<<this.tsize);
			c.strokeRect((this._cx<<this.tsize)+this._offsetX-1, (this._cy<<this.tsize)+this._offsetY-1, 3, 3);
		}else{
			c.strokeRect(this._cx*this.twidth, this._cy*this.theight, this.twidth, this.theight);
			c.strokeRect((this._cx*this.twidth)+this._offsetX-1, (this._cy*this.theight)+this._offsetY-1, 3, 3);
		}
	}else{
		c.strokeStyle = "#ff00ff";
		if(this.mode == "BINARY") {
			c.strokeRect((this._cx<<this.tsize)+this._offsetX-1, (this._cy<<this.tsize)+this._offsetY-1, 3, 3);
		}else{
			c.strokeRect((this._cx*this.twidth)+this._offsetX-1, (this._cy*this.theight)+this._offsetY-1, 3, 3);
		}
	}
};

dusk.sgui.EntityGroup.prototype._entityGroupAction = function(e) {
	if(!dusk.mods.plat.editing) return;
	
	if(!this._selectedEntity){
		var entityList = [];
		if(this.mode == "BINARY") {
			entityList = this.getEntitiesHere((this._cx<<this.tsize)+this._offsetX, (this._cy<<this.tsize)+this._offsetY, null);
		}else{
			entityList = this.getEntitiesHere((this._cx*this.twidth)+this._offsetX, (this._cy*this.theight)+this._offsetY, null);
		}
		if(entityList.length) this._selectedEntity = entityList[0];
	}else{
		this._selectedEntity = null;
	}
};

dusk.sgui.EntityGroup.prototype.allEntities = function() {
	return this._entities;
};

dusk.sgui.EntityGroup.prototype.getEntitiesHere = function(x, y, ignore, onlyOne) {
	var out = [];
	for(var c = this._entities.length-1; c >= 0; c --){
		var com = this._entities[c];
		if(com != ignore && x >= com.x && x < com.x+com.width && y >= com.y && y < com.y+com.height) {
			out.push(com);
			if(onlyOne) return out;
		}
	}
	
	return out; 
};

dusk.sgui.EntityGroup.prototype.dropEntity = function(entity, takeFocus) {
	var dropped = this.getComponent(entity.name, "PlatEntity");
	dropped.x = entity.x;
	dropped.y = entity.y;
	dropped.type = entity.type;
	this._entities.push(dropped);
	if(takeFocus) this.flow(entity.name);
	
	return dropped; 
};

dusk.sgui.EntityGroup.prototype.save = function() {
	var list = [];
	for(var i = this._entities.length-1; i >= 0; i --){
		if(this._entities[i].comName != dusk.mods.plat.seek){
			list[list.length] = {};
			list[list.length-1].name = this._entities[i].comName;
			list[list.length-1].type = this._entities[i].type;
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
	if(!dusk.mods.plat.editing) return true;
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if(this._offsetY) this._offsetY --;
		return false;
	}
	
	this._cy --;
};

dusk.sgui.EntityGroup.prototype._downAction = function(e) {
	if(!dusk.mods.plat.editing) return true;
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if((this._offsetY < 1<<this.tsize && this.mode == "BINARY") || (this._offsetY < this.theight && this.mode == "DECIMAL")) this._offsetY ++;
		return false;
	}
	
	this._cy ++;
};

dusk.sgui.EntityGroup.prototype._leftAction = function(e) {
	if(!dusk.mods.plat.editing) return true;
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if(this._offsetX) this._offsetX --;
		return false;
	}
	
	this._cx --;
};

dusk.sgui.EntityGroup.prototype._rightAction = function(e) {
	if(!dusk.mods.plat.editing) return true;
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		if((this._offsetX < 1<<this.tsize && this.mode == "BINARY") || (this._offsetX < this.twidth && this.mode == "DECIMAL")) this._offsetX ++;
		return false;
	}
	
	this._cx ++;
};

dusk.sgui.EntityGroup.prototype._numberDrop = function(e) {
	if(!dusk.mods.plat.editing) return true;
	
	var entity = {};
	entity.name = (dusk.mods.plat.editNext?dusk.mods.plat.editNext:"#"+this._entities.length);
	dusk.mods.plat.editNext = "";
	entity.type = dusk.mods.plat.editDroppers[e.keyCode-48];
	entity.x = (this._cx<<this.tsize)+this._offsetX;
	entity.y = (this._cy<<this.tsize)+this._offsetY;
	this.dropEntity(entity, false);
	
	return false;
};

dusk.sgui.EntityGroup.prototype._keyDel = function(e) {
	if(!dusk.mods.plat.editing || !this._selectedEntity) return true;
	
	for(var c in this._components) {
		if(this._components[c] == this._selectedEntity) {
			this._entities.splice(this._entities.indexOf(this._components[c]), 1);
			this.deleteComponent(c);
			this._selectedEntity = null;
		}
	}
	
	return false;
};
