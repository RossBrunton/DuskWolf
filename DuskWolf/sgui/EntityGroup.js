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
	this._cx = 0;
	this._cy = 0;
	
	this.twidth = 0;
	this.theight = 0;
	
	this.sheight = 0;
	this.swidth = 0;
	
	this._scheme = null;
	this.scheme = null;
	
	this._collDir = false;
	
	this._selectedEntity = null;
	this._offsetX = 0;
	this._offsetY = 0;
	this._showEntities = false;
	
	//Prop masks
	this._registerPropMask("sheight", "sheight");
	this._registerPropMask("swidth", "swidth");
	
	this._registerPropMask("theight", "theight");
	this._registerPropMask("twidth", "twidth");
	
	//Listeners
	for(var i = 48; i <= 57; i++) {
		this.keyPress.listen(this._numberDrop, this, {"key":i});
	}
	this.keyPress.listen(this._keyDel, this, {"key":46});
	this.keyPress.listen(function(e) {
		if(dusk.editor.active && confirm("Clear all entities?")) this.clear();
	}, this, {"key":67});
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) dusk.editor.editNext = prompt("Enter name for next entity.");
	}, this, {"key":78});
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) this._showEntities = !this._showEntities;
	}, this, {"key":69});
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) {
			dusk.load.import("dusk.sgui.EntityWorkshop");
			
			if("EntityWorkshop" in dusk.sgui) {
				dusk.sgui.getPane("workshop").parseProps({
					"focus":"ew",
					"children":{
						"ew":{
							"type":"EntityWorkshop",
							"visible":true,
						}
					},
					"active":true,
				});
			}
		}
	}, this, {"key":87});
	this.prepareDraw.listen(this._entityGroupDraw, this);
	this.action.listen(this._entityGroupAction, this);
	
	//Directions
	this.dirPress.listen(this._egRightAction, this, {"dir":dusk.sgui.c.DIR_RIGHT});
	this.dirPress.listen(this._egLeftAction, this, {"dir":dusk.sgui.c.DIR_LEFT});
	this.dirPress.listen(this._egUpAction, this, {"dir":dusk.sgui.c.DIR_UP});
	this.dirPress.listen(this._egDownAction, this, {"dir":dusk.sgui.c.DIR_DOWN});
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
			this._selectedEntity.x = (this._cx*this.twidth)+this._offsetX;
			this._selectedEntity.y = (this._cy*this.theight)+this._offsetY;
		}
	}else{
		//Call every entities' startFrame function
		for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].beforeMove();
		
		//Call every entities' moveAndCollide function
		//for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].moveAndCollide();
		this.moveEverything();
		
		//Call every entities' startFrame function
		for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].startFrame();
	}
};

dusk.sgui.EntityGroup.prototype._entityGroupDraw = function(e) {
	if(!dusk.editor.active) return;
	if(!this._focused) return;
	
	var width = this.twidth;
	var height = this.theight;
	
	var xAt = this._cx*this.twidth;
	var yAt = this._cy*this.theight;
	
	if(-e.d.sourceX + xAt > e.d.width) return;
	if(-e.d.sourceY + yAt > e.d.height) return;
	
	if(-e.d.sourceX + xAt + width > e.d.width) width = e.d.width - (-e.d.sourceX + xAt);
	if(-e.d.sourceY + yAt + height > e.d.height) height = e.d.height - (-e.d.sourceY + yAt);
	
	if(!this._selectedEntity){
		e.c.strokeStyle = "#00ffff";
	}else{
		e.c.strokeStyle = "#00ffff";
	}
	
	e.c.strokeRect(e.d.destX - e.d.sourceX + xAt,
		e.d.destY - e.d.sourceY + yAt, width, height
	);
	e.c.strokeRect(e.d.destX - e.d.sourceX + xAt + this._offsetX - 1,
		e.d.destY - e.d.sourceY + yAt + this._offsetY - 1, 3, 3
	);
	
	e.c.fillStyle = this.container.editorColour;
	e.c.fillText(dusk.editor.editNext,
		e.d.destX - e.d.sourceX + xAt + 1,
		e.d.destY - e.d.sourceY + yAt - 6
	);
	
	if(this._showEntities) {
		var y = 50 + e.d.destY + 10;
		var x = 5 + e.d.destX;
		e.c.fillStyle = this.container.editorColour;
		e.c.fillText("ENTITY LIST:", x, y);
		y += 10;
		var out = "";
		var names = dusk.entities.types.getAllNames();
		for(var i = 0; i < names.length; i ++) {
			out += names[i];
			if((i+1) % 20 == 0) {
				e.c.fillText(out, x, y);
				y += 10;
				out = "";
			}else if(i != names.length-1) {
				out += " | ";
			}
		}
		e.c.fillText(out, x, y);
	}
};

dusk.sgui.EntityGroup.prototype._entityGroupAction = function(e) {
	if(!dusk.editor.active) return;
	
	if(!this._selectedEntity){
		var entityList = this.getEntitiesHere((this._cx*this.twidth)+this._offsetX, (this._cy*this.theight)+this._offsetY, null);
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
		if(com != ignore && x >= com.x+com.collisionOffsetX && x < com.x+com.collisionWidth
		&& y >= com.y+com.collisionOffsetY && y < com.y+com.collisionHeight) {
			out.push(com);
			if(onlyOne) return out;
		}
	}

	return out; 
};

/*dusk.sgui.EntityGroup.prototype.getCollisions = function(x1, y1, x2, y2, ignore, onlyOne) {
	var out = [];
	for(var c = this._entities.length-1; c >= 0; c --){
		var com = this._entities[c];
		if(com != ignore && x1 >= com.x+com.collisionOffsetX && x1 < com.x+com.collisionWidth
		&& y1 >= com.y+com.collisionOffsetY && y1 < com.y+com.collisionHeight) {
			out.push(com);
			if(onlyOne) return out;
			continue;
		}
		if(com != ignore && x2 >= com.x+com.collisionOffsetX && x2 < com.x+com.collisionWidth
		&& y2 >= com.y+com.collisionOffsetY && y2 < com.y+com.collisionHeight) {
			out.push(com);
			if(onlyOne) return out;
		}
		
		/*if(com != ignore && !(com.x+com.collisionOffsetX < x || com.x+com.collisionWidth > endX
		 *|| com.y+com.collisionOffsetY < y || com.y+com.collisionHeight > endY)) {
			out.push(com);
			if(onlyOne) return out;
		}* /
	}
	
	return out; 
};*/

dusk.sgui.EntityGroup.prototype.moveEverything = function() {
	var solid = [1, 0].toString();
	
	this._collDir = !this._collDir;
	
	for(var e = this._entities.length-1; e >= 0; e --) {
		var now = this._entities[e];
		
		if(!now) continue;
		
		if(!now.getDx() && !now.getDy()) continue;
		
		var destX = now.x + now.getDx();
		var destY = now.y + now.getDy();
		
		if(destX >= now.x
		&& (now.scheme.tilePointIn(destX + now.collisionWidth -1, now.y + now.collisionOffsetY +1).toString() == solid
		  || now.scheme.tilePointIn(destX + now.collisionWidth -1, now.y + now.collisionHeight -1).toString() == solid)
		) {
			if(now.eProp("collides")) destX = destX - (destX % now.scheme.tileWidth()) + now.width - now.collisionWidth;
			now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_RIGHT, "target":"wall"});
			now.addToucher(dusk.sgui.c.DIR_RIGHT, "wall");
		}
		
		if(destX <= now.x
		&& (now.scheme.tilePointIn(destX + now.collisionOffsetX, now.y + now.collisionOffsetY +1).toString() == solid
		  || now.scheme.tilePointIn(destX + now.collisionOffsetX, now.y + now.collisionHeight -1).toString() == solid)
		) {
			if(now.eProp("collides"))
				destX = destX - (destX % now.scheme.tileWidth()) + now.scheme.tileWidth() - now.collisionOffsetX;
			now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_LEFT, "target":"wall"});
			now.addToucher(dusk.sgui.c.DIR_LEFT, "wall");
		}
		
		if(destY >= now.y
		&& (now.scheme.tilePointIn(now.x + now.collisionOffsetX +1, destY + now.collisionHeight -1).toString() == solid
		  || now.scheme.tilePointIn(now.x + now.collisionWidth -1, destY + now.collisionHeight -1).toString() == solid)
		) {
			if(now.eProp("collides")) destY = destY - (destY % now.scheme.tileHeight()) + now.height - now.collisionHeight;
			now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_DOWN, "target":"wall"});
			now.addToucher(dusk.sgui.c.DIR_DOWN, "wall");
		}
		
		if(destY <= now.y
		&& (now.scheme.tilePointIn(now.x + now.collisionOffsetX +1, destY + now.collisionOffsetY).toString() == solid
		  || now.scheme.tilePointIn(now.x + now.collisionWidth -1, destY + now.collisionOffsetY).toString() == solid)
		) {
			if(now.eProp("collides")) 
				destY = destY - (destY % now.scheme.tileHeight()) + now.scheme.tileHeight() - now.collisionOffsetY;
			now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_UP, "target":"wall"});
			now.addToucher(dusk.sgui.c.DIR_UP, "wall");
		}
		
		now.mark = null;
		for(var t = this._entities.length-1; t >= 0; t --) {
			var testee = this._entities[t];
			if(testee == now) continue;
			
			if(destX + now.collisionOffsetX < testee.x + testee.collisionWidth
			&& destX + now.collisionWidth > testee.x + testee.collisionOffsetX
			&& destY + now.collisionOffsetY < testee.y + testee.collisionHeight
			&& destY + now.collisionHeight > testee.y + testee.collisionOffsetY) {
				var diffX = 0;
				if(now.y + now.collisionOffsetY < testee.y + testee.collisionHeight
				&& now.y + now.collisionHeight > testee.y + testee.collisionOffsetY) {
					if(destX + now.collisionOffsetX < testee.x + testee.collisionOffsetX && now.getDx()) {
						diffX = testee.x + testee.collisionOffsetX - destX - now.collisionWidth;
					}else if(destX + now.collisionWidth > testee.x + testee.collisionWidth && now.getDx()) {
						diffX = testee.x + testee.collisionWidth - destX - now.collisionOffsetX;
					}
					
					if(destX > now.x) {
						if(testee.eProp("solid"))
							now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_RIGHT, "target":testee});
						if(now.eProp("collides"))
							testee.behaviourFire("collidedInto", {"dir":dusk.sgui.c.DIR_LEFT, "target":now});
						if(testee.eProp("solid"))
							now.addToucher(dusk.sgui.c.DIR_RIGHT, testee);
						if(now.eProp("collides"))
							testee.addToucher(dusk.sgui.c.DIR_LEFT, now);
					}else{
						if(testee.eProp("solid"))
							now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_LEFT, "target":testee});
						if(now.eProp("collides"))
							testee.behaviourFire("collidedInto", {"dir":dusk.sgui.c.DIR_RIGHT, "target":now});
						if(testee.eProp("solid"))
							now.addToucher(dusk.sgui.c.DIR_LEFT, testee);
						if(now.eProp("collides"))
							testee.addToucher(dusk.sgui.c.DIR_RIGHT, now);
					}
					
				}
				
				var diffY = 0;
				if(now.x + now.collisionOffsetX < testee.x + testee.collisionWidth
				&& now.x + now.collisionWidth > testee.x + testee.collisionOffsetX) {
					if(destY + now.collisionOffsetY < testee.y + testee.collisionOffsetY && now.getDy()) {
						diffY = testee.y + testee.collisionOffsetY - destY - now.collisionHeight;
					}else if(destY + now.collisionHeight > testee.y + testee.collisionHeight && now.getDy()) {
						diffY = testee.y + testee.collisionHeight - destY - now.collisionOffsetY;
					}
					destX += diffX;
					if(destY > now.y) {
						if(testee.eProp("solid"))
							now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_DOWN, "target":testee});
						if(now.eProp("collides"))
							testee.behaviourFire("collidedInto", {"dir":dusk.sgui.c.DIR_UP, "target":now});
						if(testee.eProp("solid"))
							now.addToucher(dusk.sgui.c.DIR_DOWN, testee);
						if(now.eProp("collides"))
							testee.addToucher(dusk.sgui.c.DIR_UP, now);
					}else{
						if(testee.eProp("solid"))
							now.behaviourFire("collide", {"dir":dusk.sgui.c.DIR_UP, "target":testee});
						if(now.eProp("collides"))
							testee.behaviourFire("collidedInto", {"dir":dusk.sgui.c.DIR_DOWN, "target":now});
						if(testee.eProp("solid"))
							now.addToucher(dusk.sgui.c.DIR_UP, testee);
						if(now.eProp("collides"))
							testee.addToucher(dusk.sgui.c.DIR_DOWN, now);
					}
				}
				
				if(now.eProp("collides") && testee.eProp("solid")) destX += diffX;
				if(now.eProp("collides") && testee.eProp("solid")) destY += diffY;
			}
		}
		
		now.x = destX;
		now.y = destY;
	}
};

dusk.sgui.EntityGroup.prototype.dropEntity = function(entity, takeFocus) {
	var dropped = this.getComponent(entity.name, "Entity");
	dropped.x = entity.x;
	dropped.y = entity.y;
	dropped.entType = entity.type;
	if(this.scheme) dropped.scheme = this.scheme;
	if(this.particles) dropped.particles = this.particles;
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
		if(this._offsetY < this.theight) this._offsetY ++;
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
		if(this._offsetX < this.twidth) this._offsetX ++;
		return false;
	}
	
	this._cx ++;
};

dusk.sgui.EntityGroup.prototype._numberDrop = function(e) {
	if(!dusk.editor.active) return true;
	
	if(e.shift) {
		dusk.editor.editDroppers[e.key-48] = prompt("Enter a type for dropper #"+(e.key-48));
		return;
	}
	
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
	entity.x = (this._cx*this.twidth)+this._offsetX;
	entity.y = (this._cy*this.theight)+this._offsetY;
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
