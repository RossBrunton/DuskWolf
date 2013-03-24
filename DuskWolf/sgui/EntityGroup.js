//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.Entity");
dusk.load.require("dusk.editor");

dusk.load.provide("dusk.sgui.EntityGroup");

dusk.sgui.EntityGroup = function (parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this._entities = [];
	
	//this.width = 400;
	//this.height = 400;
	//this.yOffset = 200;
	//this.xOffset = 200;
	//this.x = 200;
	//this.y = 200;
	//this.mark = "#ff0000";
	
	this._cx = 0;
	this._cy = 0;
	
	this.tsize = 0;
	this.twidth = 0;
	this.theight = 0;
	
	this.ssize = 0;
	this.sheight = 0;
	this.swidth = 0;
	
	this.mode = "BINARY";
	
	this._scheme = null;
	this.scheme = null;
	
	this._selectedEntity = null;
	this._offsetX = 0;
	this._offsetY = 0;
	
	//Prop masks
	this._registerPropMask("mode", "mode");
	
	this._registerPropMask("ssize", "ssize");
	this._registerPropMask("sheight", "sheight");
	this._registerPropMask("swidth", "swidth");
	
	this._registerPropMask("tsize", "tsize");
	this._registerPropMask("theight", "theight");
	this._registerPropMask("twidth", "twidth");
	
	//Listeners
	for(var i = 48; i <= 57; i++) {
		this.keyPress.listen(this._numberDrop, this, {"key":i});
	}
	this.keyPress.listen(this._keyDel, this, {"key":46});
	this.keyPress.listen(function(e) {if(dusk.editor.active && confirm("Delete all entities?")) this.clear();}, this, {"key":46});
	this.prepareDraw.listen(this._entityGroupDraw, this);
	this.action.listen(this._entityGroupAction, this);
	
	//Directions
	this.dirPress.listen(this._egRightAction, this, {"dir":dusk.sgui.Component.DIR_RIGHT});
	this.dirPress.listen(this._egLeftAction, this, {"dir":dusk.sgui.Component.DIR_LEFT});
	this.dirPress.listen(this._egUpAction, this, {"dir":dusk.sgui.Component.DIR_UP});
	this.dirPress.listen(this._egDownAction, this, {"dir":dusk.sgui.Component.DIR_DOWN});
};
dusk.sgui.EntityGroup.prototype = new dusk.sgui.Group();
dusk.sgui.EntityGroup.constructor = dusk.sgui.EntityGroup;

dusk.sgui.EntityGroup.prototype.className = "EntityGroup";

dusk.sgui.EntityGroup.prototype.doFrame = function() {
	if(dusk.editor.active) {
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
	}else{
		//Call every entities' moveAndCollide function
		for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].moveAndCollide();
		
		//Call every entities' startFrame function
		for(var i = this._entities.length-1; i >= 0; i --) if(i < this._entities.length) this._entities[i].startFrame();
	}
};

dusk.sgui.EntityGroup.prototype._entityGroupDraw = function(c) {
	if(!dusk.editor.active) return;
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
	if(!dusk.editor.active) return;
	
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
		if(com != ignore && x >= com.x+com.collisionOffsetX && x < com.x+com.collisionWidth && y >= com.y+com.collisionOffsetY && y < com.y+com.collisionHeight) {
			out.push(com);
			if(onlyOne) return out;
		}
	}

	return out; 
};

dusk.sgui.EntityGroup.prototype.getCollisions = function(x1, y1, x2, y2, ignore, onlyOne) {
	var out = [];
	for(var c = this._entities.length-1; c >= 0; c --){
		var com = this._entities[c];
		if(com != ignore && x1 >= com.x+com.collisionOffsetX && x1 < com.x+com.collisionWidth && y1 >= com.y+com.collisionOffsetY && y1 < com.y+com.collisionHeight) {
			out.push(com);
			if(onlyOne) return out;
			continue;
		}
		if(com != ignore && x2 >= com.x+com.collisionOffsetX && x2 < com.x+com.collisionWidth && y2 >= com.y+com.collisionOffsetY && y2 < com.y+com.collisionHeight) {
			out.push(com);
			if(onlyOne) return out;
		}
		
		/*if(com != ignore && !(com.x+com.collisionOffsetX < x || com.x+com.collisionWidth > endX || com.y+com.collisionOffsetY < y || com.y+com.collisionHeight > endY)) {
			out.push(com);
			if(onlyOne) return out;
		}*/
	}
	
	return out; 
};

dusk.sgui.EntityGroup.prototype.dropEntity = function(entity, takeFocus) {
	var dropped = this.getComponent(entity.name, "Entity");
	dropped.x = entity.x;
	dropped.y = entity.y;
	dropped.entType = entity.type;
	if(this.scheme) dropped.scheme = this.scheme;
	this._entities.push(dropped);
	dropped.onDelete.listen(dusk.sgui.EntityGroup.prototype._entityDeleted, this);
	if(takeFocus) this.flow(entity.name);
	
	return dropped; 
};

dusk.sgui.EntityGroup.prototype.saveBM = function() {
	var list = [];
	for(var i = this._entities.length-1; i >= 0; i --){
		if(this._entities[i].comName != dusk.entities.seek){
			list[list.length] = {};
			list[list.length-1].name = this._entities[i].comName;
			list[list.length-1].type = this._entities[i].entType;
			list[list.length-1].x = this._entities[i].x;
			list[list.length-1].y = this._entities[i].y;
		}
	}
	
	return list;
};

dusk.sgui.EntityGroup.prototype.loadBM = function(ents) {
	this.clear();
	for(var i = ents.length-1; i >= 0; i --){
		this.dropEntity(ents[i]);
	}
};

Object.defineProperty(dusk.sgui.EntityGroup.prototype, "scheme", {
	get: function() {
		return this._scheme;
	},
	
	set: function(val) {
		this._scheme = val;
		for(var i = this._entities.length-1; i >= 0; i --){
			this._entities[i].scheme = val;
		}
	}
});

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

dusk.sgui.EntityGroup.prototype._entityDeleted = function(e) {
	for(var i = this._entities.length-1; i >= 0; i --) {
		if(this._entities[i].comName == e.com.comName) {
			this._entities.splice(i, 1);
			return;
		}
	}
};

dusk.sgui.EntityGroup.prototype._egUpAction = function(e) {
	if(!dusk.editor.active) return true;
	if(e.e.ctrlKey) return true;
	if(e.e.shiftKey) {
		if(this._offsetY) this._offsetY --;
		return false;
	}
	
	this._cy --;
};

dusk.sgui.EntityGroup.prototype._egDownAction = function(e) {
	if(!dusk.editor.active) return true;
	if(e.e.ctrlKey) return true;
	if(e.e.shiftKey) {
		if((this._offsetY < 1<<this.tsize && this.mode == "BINARY") || (this._offsetY < this.theight && this.mode == "DECIMAL")) this._offsetY ++;
		return false;
	}
	
	this._cy ++;
};

dusk.sgui.EntityGroup.prototype._egLeftAction = function(e) {
	if(!dusk.editor.active) return true;
	if(e.e.ctrlKey) return true;
	if(e.e.shiftKey) {
		if(this._offsetX) this._offsetX --;
		return false;
	}
	
	this._cx --;
};

dusk.sgui.EntityGroup.prototype._egRightAction = function(e) {
	if(!dusk.editor.active) return true;
	if(e.e.ctrlKey) return true;
	if(e.e.shiftKey) {
		if((this._offsetX < 1<<this.tsize && this.mode == "BINARY") || (this._offsetX < this.twidth && this.mode == "DECIMAL")) this._offsetX ++;
		return false;
	}
	
	this._cx ++;
};

dusk.sgui.EntityGroup.prototype._numberDrop = function(e) {
	if(!dusk.editor.active) return true;
	
	var entity = {};
	
	if(dusk.editor.editNext) {
		entity.name = dusk.editor.editNext;
	}else{
		var i = 0;
		do {
			i ++;
			entity.name = "#"+i;
		} while(this.getComponent("#"+i));
	}
	
	dusk.editor.editNext = "";
	entity.type = dusk.editor.editDroppers[e.key-48];
	entity.x = (this._cx<<this.tsize)+this._offsetX;
	entity.y = (this._cy<<this.tsize)+this._offsetY;
	this.dropEntity(entity, false);
	
	return false;
};

dusk.sgui.EntityGroup.prototype._keyDel = function(e) {
	if(!dusk.editor.active || !this._selectedEntity) return true;
	
	for(var c in this._components) {
		if(this._components[c] == this._selectedEntity) {
			this._entities.splice(this._entities.indexOf(this._components[c]), 1);
			this.deleteComponent(c);
			this._selectedEntity = null;
		}
	}
	
	return false;
};

Object.seal(dusk.sgui.EntityGroup);
Object.seal(dusk.sgui.EntityGroup.prototype);

dusk.sgui.registerType("EntityGroup", dusk.sgui.EntityGroup);
