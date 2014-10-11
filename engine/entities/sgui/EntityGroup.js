//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.sgui.EntityGroup", (function() {
	var Group = load.require("dusk.sgui.Group");
	var Entity = load.require("dusk.entities.sgui.Entity");
	var EditableTileMap = load.require("dusk.tiles.sgui.EditableTileMap");
	var sgui = load.require("dusk.sgui");
	var editor = load.require("dusk.rooms.editor");
	var entities = load.require("dusk.entities");
	var c = load.require("dusk.sgui.c");
	var EntityWorkshop = load.suggest("dusk.entities.sgui.EntityWorkshop", function(p) {EntityWorkshop = p});
	var interaction = load.require("dusk.input.interaction");
	var controls = load.require("dusk.input.controls");
	
	/** An entity group is a group that stores `{@link dusk.entities.sgui.Entity}` and provides the ability to move them 
	 * and have them collide with each other.
	 * 
	 * This component, when active and `dusk.rooms.editor#active` is true, will allow the user to edit the entities by 
	 * dragging them around, using the number keys to drop entries and so on. An `dusk.entities.sgui.EntityWorkshop` is also
	 * created and can be opened using the `w` key.
	 * 
	 * Entities should be added using `dusk.entities.sgui.EntityGroup#dropEntity` function.
	 * 
	 * @param {?dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @extends dusk.sgui.Group
	 * @constructor
	 */
	var EntityGroup = function (parent, name) {
		Group.call(this, parent, name);
		
		/** Array of all the entities in this group. In no particular order.
		 * @type array
		 * @private
		 */
		this._entities = [];
		this._eltr = [];
		this._ertl = [];
		this._ettb = [];
		this._ebtt = [];
		
		this._cx = 0;
		this._cy = 0;
		
		this.twidth = 0;
		this.theight = 0;
		
		this.sheight = 0;
		this.swidth = 0;
		
		this._scheme = null;
		this.scheme = null;
		
		this.particles = null;
		this.fluid = null;
		
		this._selectedEntity = null;
		this._offsetX = 0;
		this._offsetY = 0;
		this._showEntities = false;
		
		this._priorEntity = "";
		
		//Prop masks
		this._registerPropMask("sheight", "sheight");
		this._registerPropMask("swidth", "swidth");
		
		this._registerPropMask("theight", "theight");
		this._registerPropMask("twidth", "twidth");
		
		//Listeners
		for(var i = 48; i <= 57; i++) {
			this.onInteract.listen(this._numberDrop.bind(this), (i << 16) | interaction.KEY_DOWN);
		}
		
		this.onControl.listen(this._keyDel.bind(this), controls.addControl("entitygroup_del", "DEL"));
		
		this.onControl.listen((function(e) {
			if(editor.active && confirm("Clear all entities?")) this.clear();
		}).bind(this), controls.addControl("entitygroup_clear", "C"));
		
		this.onControl.listen((function(e) {
			if(editor.active && !e.alt) {
				editor.editNext = prompt("Enter name for next entity.");
			}else{
				return true;
			}
		}).bind(this), controls.addControl("entitygroup_name", "N"));
		
		this.onControl.listen((function(e) {
			if(editor.active) this._showEntities = !this._showEntities;
		}).bind(this), controls.addControl("entitygroup_show", "E"));
		
		this.onControl.listen((function(e) {
			if(editor.active) {
				load.import("dusk.entities.sgui.EntityWorkshop").then(function(ew) {
					sgui.get("workshop", true).update({
						"focus":"ew",
						"children":{
							"ew":{
								"type":"EntityWorkshop",
								"visible":true,
							}
						},
						"active":true,
					});
				});
			}
		}).bind(this), controls.addControl("entitygroup_workshop", "W"));
		
		this.prepareDraw.listen(_entityGroupDraw.bind(this));
		this.action.listen(this._entityGroupAction.bind(this));
		
		//Directions
		this.dirPress.listen(this._egRightAction.bind(this), c.DIR_RIGHT);
		this.dirPress.listen(this._egLeftAction.bind(this), c.DIR_LEFT);
		this.dirPress.listen(this._egUpAction.bind(this), c.DIR_UP);
		this.dirPress.listen(this._egDownAction.bind(this), c.DIR_DOWN);
	};
	EntityGroup.prototype = Object.create(Group.prototype);
	
	EntityGroup.prototype.doFrame = function(active) {
		if(editor.active) {
			//Editing
			if(this.focused) {
				EditableTileMap.globalEditX = this._cx;
				EditableTileMap.globalEditY = this._cy;
			}else{
				this._cx = EditableTileMap.globalEditX;
				this._cy = EditableTileMap.globalEditY;
			}
			
			if(this.focus != "_noselectedentity") {
				this._priorFocus = "_noselectedentity";
				this.focus = "_noselectedentity";
			}
			
			if(this._selectedEntity){
				this._selectedEntity.x = (this._cx*this.twidth)+this._offsetX;
				this._selectedEntity.y = (this._cy*this.theight)+this._offsetY;
			}
		}else{
			if(this._priorFocus) {
				this.focus = this._priorFocus;
				this._priorFocus = "";
			}
			
			//Call every entities' beforeMove function
			if(active) for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].beforeMove();
			
			//Call every entities' moveAndCollide function
			//for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].moveAndCollide();
			if(active) this.moveEverything();
			
			//Call every entities' startFrame function
			for(var i = this._entities.length-1; i >= 0; i --) this._entities[i].startFrame(active);
		}
	};
	
	var _entityGroupDraw = function(e) {
		if(!editor.active) return;
		if(!this.focused) return;
		
		var width = this.twidth;
		var height = this.theight;
		
		var xAt = this._cx*this.twidth;
		var yAt = this._cy*this.theight;
		
		if(-e.d.slice.x + xAt > e.d.dest.width) return;
		if(-e.d.slice.y + yAt > e.d.dest.height) return;
		
		if(-e.d.slice.x + xAt + width > e.d.dest.width) width = e.d.dest.width - (-e.d.slice.x + xAt);
		if(-e.d.slice.y + yAt + height > e.d.dest.height) height = e.d.dest.height - (-e.d.slice.y + yAt);
		
		if(!this._selectedEntity){
			e.c.strokeStyle = "#00ffff";
		}else{
			e.c.strokeStyle = "#ff00ff";
		}
		e.c.lineWidth = 1;
		
		e.c.strokeRect(e.d.dest.x - e.d.slice.x + xAt,
			e.d.dest.y - e.d.slice.y + yAt, width, height
		);
		e.c.strokeRect(e.d.dest.x - e.d.slice.x + xAt + this._offsetX - 1,
			e.d.dest.y - e.d.slice.y + yAt + this._offsetY - 1, 3, 3
		);
		
		e.c.fillStyle = this.container.editorColour;
		e.c.fillText(editor.editNext,
			e.d.dest.x - e.d.slice.x + xAt + 1,
			e.d.dest.y - e.d.slice.y + yAt - 6
		);
		
		if(this._showEntities) {
			var y = 50 + e.d.dest.y + 10;
			var x = 5 + e.d.dest.x;
			e.c.fillStyle = this.container.editorColour;
			e.c.fillText("ENTITY LIST:", x, y);
			y += 10;
			var out = "";
			var names = entities.types.getAllNames();
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
			
			y += 20;
			if(this._selectedEntity) {
				e.c.fillText("SELECTED: "+this._selectedEntity.name +" : "+this._selectedEntity.entType, x, y);
			}else{
				e.c.fillText("SELECTED: [none]", x, y);
			}
			
			y += 10;
			for(var i = 0; i < editor.editDroppers.length; i ++) {
				y += 10;
				e.c.fillText(i + ": "+editor.editDroppers[i], x, y);
			}
		}
	};
	
	EntityGroup.prototype._entityGroupAction = function(e) {
		if(!editor.active) return;
		
		if(!this._selectedEntity){
			var entityList = this.getEntitiesHere(
				(this._cx*this.twidth)+this._offsetX, (this._cy*this.theight)+this._offsetY,
			null);
			if(entityList.length) this._selectedEntity = entityList[0];
		}else{
			this._selectedEntity = null;
		}
	};
	
	EntityGroup.prototype.allEntities = function() {
		return this._entities;
	};
	
	EntityGroup.prototype.filter = function(filter) {
		var out = [];
		
		for(var c = this._entities.length-1; c >= 0; c --){
			if(this._entities[c].evalTrigger(filter)) out.push(this._entities[c]);
		}
		
		return out;
	};
	
	//Runs in O(n) time
	EntityGroup.prototype.getEntitiesHere = function(x, y, ignore, onlyOne) {
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
	
	EntityGroup.prototype.getEntitiesExactlyHere = function(x, y, ignore, onlyOne) {
		var out = [];
		for(var c = this._entities.length-1; c >= 0; c --){
			var com = this._entities[c];
			if(com != ignore && x == com.x && y == com.y) {
				out.push(com);
				if(onlyOne) return out;
			}
		}
		
		return out; 
	};
	
	/*dusk.entities.sgui.EntityGroup.prototype.getCollisions = function(x1, y1, x2, y2, ignore, onlyOne) {
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
	
	//Runs in O(n^2) time
	EntityGroup.prototype.moveEverything = function() {
		var solid = [1, 0].toString();
		
		for(var e = this._entities.length-1; e >= 0; e --) {
			if(!this._entities[e]) continue;
			this._singleMoveAndCollide(this._entities[e], false);
		}
	};
	
	EntityGroup.prototype._singleMoveAndCollide = function(ent, noMove) {
		if(!noMove && !ent.dx && !ent.dy) return;
		
		var destX = ent.x;
		var destY = ent.y;
		if(!noMove) {
			destX = ent.x + ent.dx;
			destY = ent.y + ent.dy;
		}
		
		for(var t = this._entities.length-1; t >= 0; t --) {
			var testee = this._entities[t];
			if(testee == ent) continue;
			
			if(destX + ent.collisionOffsetX < testee.x + testee.collisionWidth
			&& destX + ent.collisionWidth > testee.x + testee.collisionOffsetX
			&& destY + ent.collisionOffsetY < testee.y + testee.collisionHeight
			&& destY + ent.collisionHeight > testee.y + testee.collisionOffsetY) {
				var diffX = 0;
				if(ent.y + ent.collisionOffsetY < testee.y + testee.collisionHeight
				&& ent.y + ent.collisionHeight > testee.y + testee.collisionOffsetY) {
					if(testee.eProp("solid")
					&& destX + ent.collisionOffsetX < testee.x + testee.collisionOffsetX && ent.dx) {
						diffX = testee.x + testee.collisionOffsetX - destX - ent.collisionWidth;
					}else if(testee.eProp("solid")
					&& destX + ent.collisionWidth > testee.x + testee.collisionWidth && ent.dx) {
						diffX = testee.x + testee.collisionWidth - destX - ent.collisionOffsetX;
					}
					
					if(destX > ent.x) {
						this.resolveCollision(ent, testee, c.DIR_RIGHT, c.DIR_LEFT);
					}else{
						this.resolveCollision(ent, testee, c.DIR_LEFT, c.DIR_RIGHT);
					}
					
				}
				
				var diffY = 0;
				if(ent.x + ent.collisionOffsetX < testee.x + testee.collisionWidth
				&& ent.x + ent.collisionWidth > testee.x + testee.collisionOffsetX) {
					if(testee.eProp("solid")
					&& destY + ent.collisionOffsetY < testee.y + testee.collisionOffsetY && ent.dy) {
						diffY = testee.y + testee.collisionOffsetY - destY - ent.collisionHeight;
					}else if(testee.eProp("solid")
					&& destY + ent.collisionHeight > testee.y + testee.collisionHeight && ent.dy) {
						diffY = testee.y + testee.collisionHeight - destY - ent.collisionOffsetY;
					}
					
					if(destY > ent.y) {
						this.resolveCollision(ent, testee, c.DIR_DOWN, c.DIR_UP);
					}else{
						this.resolveCollision(ent, testee, c.DIR_UP, c.DIR_DOWN);
					}
				}
				
				if(ent.eProp("collides") && testee.eProp("solid")) destX += diffX;
				if(ent.eProp("collides") && testee.eProp("solid")) destY += diffY;
			}
		}
		
		if(ent.scheme) {
			if(destX >= ent.x){
				var altera =ent.scheme.mapSolidIn(destX+ent.collisionWidth, ent.y+ent.collisionOffsetY+1, false, false);
				var alterb =ent.scheme.mapSolidIn(destX+ent.collisionWidth, ent.y+ent.collisionHeight-1, false, false);
				
				var alter = 
				alterb == altera ? alterb :
				alterb == 0 ? altera :
				altera == 0 ? alterb :
				(altera+alterb)/2; 
				
				if(alter) {
					if(ent.eProp("collides")) destX += alter;
					ent.behaviourFire("collide", {"dir":c.DIR_RIGHT, "target":"wall"});
					ent.addToucher(c.DIR_RIGHT, "wall");
				}
			}
			
			if(destX < ent.x){
				var altera =ent.scheme.mapSolidIn(destX+ent.collisionOffsetX, ent.y+ent.collisionOffsetY+1, true,false);
				var alterb =ent.scheme.mapSolidIn(destX+ent.collisionOffsetX, ent.y+ent.collisionHeight-1, true, false);
				
				var alter = 
				alterb == altera ? alterb :
				alterb == 0 ? altera :
				altera == 0 ? alterb :
				(altera+alterb)/2; 
				
				if(alter) {
					if(ent.eProp("collides")) destX += alter;
					ent.behaviourFire("collide", {"dir":c.DIR_LEFT, "target":"wall"});
					ent.addToucher(c.DIR_LEFT, "wall");
				}
			}
			
			if(destY > ent.y){
				var altera =ent.scheme.mapSolidIn(ent.x+ent.collisionOffsetX+1, destY+ent.collisionHeight, false, true);
				var alterb =ent.scheme.mapSolidIn(ent.x+ent.collisionWidth-1, destY + ent.collisionHeight, false, true);
				
				var alter = 
				alterb == altera ? alterb :
				alterb == 0 ? altera :
				altera == 0 ? alterb :
				(altera+alterb)/2; 
				
				if(alter) {
					if(ent.eProp("collides")) destY += alter;
					ent.behaviourFire("collide", {"dir":c.DIR_DOWN, "target":"wall"});
					ent.addToucher(c.DIR_DOWN, "wall");
				}
			}
			
			if(destY < ent.y){
				var altera =ent.scheme.mapSolidIn(ent.x+ent.collisionOffsetX+1, destY+ent.collisionOffsetY, true, true);
				var alterb =ent.scheme.mapSolidIn(ent.x+ent.collisionWidth-1, destY + ent.collisionOffsetY, true, true);
				
				var alter = 
				alterb == altera ? alterb :
				alterb == 0 ? altera :
				altera == 0 ? alterb :
				(altera+alterb)/2; 
				
				if(alter) {
					if(ent.eProp("collides")) destY += alter;
					ent.behaviourFire("collide", {"dir":c.DIR_UP, "target":"wall"});
					ent.addToucher(c.DIR_UP, "wall");
				}
			}
		}
		
		if(!noMove) {
			ent.x = destX;
			ent.y = destY;
		}
	};
	
	EntityGroup.prototype.resolveCollision = function(now, testee, dir, oppDir) {
		if(testee.eProp("solid"))
			now.behaviourFire("collide", {"dir":dir, "target":testee});
		if(now.eProp("collides"))
			testee.behaviourFire("collidedInto", {"dir":oppDir, "target":now});
		//if(testee.eProp("solid"))
			now.addToucher(dir, testee);
		//if(now.eProp("collides"))
			testee.addToucher(oppDir, now);
	};

	EntityGroup.prototype.hasEntity = function(entity) {
		for(var i = 0; i < this._entities.length; i ++) {
			if(this._entities[i] == entity) return true;
		}
		return false;
	};
	
	//Runs in O(1) time
	EntityGroup.prototype.dropEntity = function(entity, takeFocus) {
		if(!("name" in entity)) {
			var i = 0;
			do {
				i ++;
				entity.name = "#"+i;
			} while(this.getComponent("#"+i));
		}
		
		var dropped = this.getComponent(entity.name, "Entity");
		dropped.x = entity.x;
		dropped.y = entity.y;
		dropped.entType = entity.type;
		
		if(this.scheme) dropped.scheme = this.scheme;
		if(this.particles) dropped.particles = this.particles;
		if(this.fluid) dropped.fluid = this.fluid;
		
		this._entities.push(dropped);
		dropped.onDelete.listen(EntityGroup.prototype._entityDeleted.bind(this));
		if(takeFocus) this.flow(entity.name);
		this._singleMoveAndCollide(dropped, true);
		
		//Insert all the entities!
		if(this._eltr.length === 0) {
			this._eltr[0] = dropped;
			this._ertl[0] = dropped;
			this._ettb[0] = dropped;
			this._ebtt[0] = dropped;
		}else{
			var spliceAndAdd = function(arr, id, elem, prp) {
				for(var i = arr.length; i > id; i --) {
					arr[i] = arr[i-1];
					arr[i][prp] ++;
				}
				
				arr[id] = elem;
				arr[id][prp] = id;
			}
			
			var binsert = function(array, xy, mod, prp) {
				var e = array;
				var min = 0;
				var max = e.length-1;
				
				while(true) {
					var mid = ~~((max+min)/2);
					
					if(mid == 0 && e[0][xy] + e[0][mod] >= dropped[xy] + dropped[mod]) {
						spliceAndAdd(e, 0, dropped, prp);
						break;
					}
					
					if((e[mid][xy] + e[mid][mod] <= dropped[xy] + dropped[mod])
					&& (mid == e.length-1 || e[mid+1][xy] + e[mid+1][mod] >= dropped[xy] + dropped[mod])
					) {
						spliceAndAdd(e, mid+1, dropped, prp);
						break;
					}else if(e[mid][xy] + e[mid][mod] >= dropped[xy] + dropped[mod]) {
						max = mid - 1;
					}else{
						min = mid + 1;
					}
				}
			}
			
			binsert.call(this, this._eltr, "x", "collisionOffsetX", "iltr");
			binsert.call(this, this._ertl, "x", "collisionWidth", "irtl");
			binsert.call(this, this._ettb, "y", "collisionOffsetY", "ittb");
			binsert.call(this, this._ebtt, "y", "collisionHeight", "ibtt");
		}
		
		return dropped; 
	};
	
	EntityGroup.prototype.saveBM = function(addDep) {
		var list = [];
		for(var i = this._entities.length-1; i >= 0; i --){
			if(this._entities[i].name != entities.seek && !this._entities[i].eProp("noSave")){
				this._entities[i].behaviourFire("saveBM", {"addDep":addDep});
				
				list[list.length] = {};
				list[list.length-1].name = this._entities[i].name;
				list[list.length-1].type = this._entities[i].entType;
				list[list.length-1].x = this._entities[i].x;
				list[list.length-1].y = this._entities[i].y;
			}
		}
		
		return list;
	};
	
	EntityGroup.prototype.loadBM = function(ents) {
		this.clear();
		this.getComponent("_noselectedentity", "NullCom");
		for(var i = ents.length-1; i >= 0; i --){
			this.dropEntity(ents[i]);
		}
	};
	
	Object.defineProperty(EntityGroup.prototype, "scheme", {
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
	
	EntityGroup.prototype.adjustAll = function(dx, dy) {
		for(var i = this._entities.length-1; i >= 0; i --){
			this._entities[i].x += dx;
			this._entities[i].y += dy;
		}
	};
	
	EntityGroup.prototype.clear = function() {
		for(var c = this._componentsArr.length-1; c >= 0; c --) {
			if(this._componentsArr[c].name != "blank") {
				this.deleteComponent(this._componentsArr[c].name);
			}
		}
		
		this._entities = [];
		this._eltr = [];
		this._ertl = [];
		this._ettb = [];
		this._ebtt = [];
	};
	
	EntityGroup.prototype._entityDeleted = function(e) {
		for(var i = this._entities.length-1; i >= 0; i --) {
			if(this._entities[i].name == e.com.name) {
				this._entities.splice(i, 1);
				return;
			}
		}
	};
	
	EntityGroup.prototype._egUpAction = function(e) {
		if(!editor.active) return true;
		if(e.e.ctrl) return true;
		if(e.e.shift) {
			if(this._offsetY) this._offsetY --;
			return false;
		}
		
		this._cy --;
	};
	
	EntityGroup.prototype._egDownAction = function(e) {
		if(!editor.active) return true;
		if(e.e.ctrl) return true;
		if(e.e.shift) {
			if(this._offsetY < this.theight) this._offsetY ++;
			return false;
		}
		
		this._cy ++;
	};
	
	EntityGroup.prototype._egLeftAction = function(e) {
		if(!editor.active) return true;
		if(e.e.ctrl) return true;
		if(e.e.shift) {
			if(this._offsetX) this._offsetX --;
			return false;
		}
		
		this._cx --;
	};
	
	EntityGroup.prototype._egRightAction = function(e) {
		if(!editor.active) return true;
		if(e.e.ctrl) return true;
		if(e.e.shift) {
			if(this._offsetX < this.twidth) this._offsetX ++;
			return false;
		}
		
		this._cx ++;
	};
	
	EntityGroup.prototype._numberDrop = function(e) {
		if(!editor.active) return true;
		
		if(e.shift) {
			editor.editDroppers[e.which-48] = prompt("Enter a type for dropper #"+(e.which-48));
			if(editor.editDroppers[e.which-48] && !entities.types.isValidType(editor.editDroppers[e.which-48])) {
				console.error(editor.editDroppers[e.which-48]+" is not a valid type.");
				editor.editDroppers[e.which-48] = undefined;
			}
			return;
		}
		
		if(!editor.editDroppers[e.which-48]) {
			console.warn("Dropper "+(e.which-48)+" not yet set.");
			return;
		}
		
		var entity = {};
		
		if(editor.editNext) {
			entity.name = editor.editNext;
		}
		
		editor.editNext = "";
		entity.type = editor.editDroppers[e.which-48];
		entity.x = (this._cx*this.twidth)+this._offsetX;
		entity.y = (this._cy*this.theight)+this._offsetY;
		this.dropEntity(entity, false);
		
		return false;
	};
	
	EntityGroup.prototype._keyDel = function(e) {
		if(!editor.active || !this._selectedEntity) return true;
		
		for(var c = this._componentsArr.length-1; c >= 0; c --) {
			if(this._componentsArr[c] == this._selectedEntity) {
				this._entities.splice(this._entities.indexOf(this._componentsArr[c]), 1);
				this.deleteComponent(this._componentsArr[c].name);
				this._selectedEntity = null;
			}
		}
		
		return false;
	};
	
	sgui.registerType("EntityGroup", EntityGroup);
	
	return EntityGroup;
})());
