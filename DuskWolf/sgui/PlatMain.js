//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Group");
loadComponent("PlatEntity");

/***/
sgui.PlatMain = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Group.call(this, parent, events, comName);
		
		this._registerFrameHandler(this._platMainFrame);
		
		this.prop("width", this._events.getVar("sys.sg.width"));
		this.prop("height", this._events.getVar("sys.sg.height"));
		
		this._registerPropMask("sprite-size", "_ssize", true);
		this._registerPropMask("tile-size", "_tsize", true);
		this._registerPropMask("spawn", "_spawn", true);
		this._registerProp("room", this._room, null, ["spawn"]);
		
		this._tsize = this._events.getVar("plat.tsize");
		this._ssize = this._events.getVar("plat.ssize");
		this._scrollSpeed = this._theme("plat.scrollSpeed", 10);
		this._spawn = 0;
		this._entities = [];
	}
};
sgui.PlatMain.prototype = new sgui.Group();
sgui.PlatMain.constructor = sgui.PlatMain;

sgui.PlatMain.prototype.className = "PlatMain";

sgui.PlatMain.prototype._room = function(name, value) {
	var room = this._events.getVar("proom."+value);
	this.parseProps({"children":[
		{"name":"scheme", "type":"TileMap", "src":"pimg/schematics.png", "visible":false, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":room.scheme, "rows":room.rows, "cols":room.cols, "width":this.prop("width"), "height":this.prop("height")}},
		{"name":"back", "type":"TileMap", "src":room.backSrc, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":room.back, "rows":room.rows, "cols":room.cols}, "width":this.prop("width"), "height":this.prop("height")},
		{"name":"entities", "type":"Group", "children":[
			{"name":this._events.getVar("plat.seek"), "type":"PlatEntity"},
		]},
		{"name":"over", "type":"TileMap", "src":room.overSrc, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":room.over, "rows":room.rows, "cols":room.cols}, "width":this.prop("width"), "height":this.prop("height")}
	]});
	
	this.path("entities/"+this._events.getVar("plat.seek")).typeChange(this._events.getVar("plat.seekType"));
	var crd = this.getComponent("scheme").lookTile(this._spawn, 1);
	this.path("entities/"+this._events.getVar("plat.seek")).gridGo(crd[0], crd[1]);
	
	this._entities = [];
	this._entities[0] = this.path("entities/"+this._events.getVar("plat.seek"));
	
	var waitingEnts = room.entities;
	for(var i = 0; i < waitingEnts.length; i++) {
		this._entities[this._entities.length] = this.path("entities").getComponent(waitingEnts[i].name, "PlatEntity");
		this._entities[this._entities.length-1].typeChange(waitingEnts[i].type);
		this._entities[this._entities.length-1].gridGo(waitingEnts[i].x, waitingEnts[i].y);
	}
	
	this.autoScroll(200);
};

sgui.PlatMain.prototype._platMainFrame = function(e) {
	// Center the player
	this.autoScroll(this._scrollSpeed);
	
	//Resolve collisions
	for(var i = this._entities.length-1; i >= 0; i--) {
		for(var j = i; j >= 0; j--) {
			if(this._entities[i] && this._entities[j] && this._entities[i] != this._entities[j]) {
				if(Math.abs(this._entities[i].x - this._entities[j].x) < (this._entities[i].prop("width"))
				&& Math.abs(this._entities[i].y - this._entities[j].y) < (this._entities[i].prop("height"))){
					//Resolve it!
					if(Math.abs(this._entities[i].x - this._entities[j].x) > Math.abs(this._entities[i].y - this._entities[j].y)){
						//Resolve horizontally
						if(this._entities[i].x > this._entities[j].x) {
							this._entities[i].collideRight(this._entities[j]);
							this._entities[j].collideLeft(this._entities[i]);
						}else{
							this._entities[j].collideRight(this._entities[i]);
							this._entities[i].collideLeft(this._entities[j]);
						}
						
						if(this._entities[j].eProp("solid") && this._entities[i].eProp("solid")){ 
							if(!this._entities[j].eProp("anchor") && !this._entities[i].eProp("anchor")) {
								var delta = ((this._entities[i].prop("width") - Math.abs(this._entities[i].x - this._entities[j].x)) /2) +1;
								if(this._entities[i].x > this._entities[j].x) {
									this._entities[i].x += delta;
									if(this._entities[i].dx < 0) this._entities[i].dx = 0;
									this._entities[j].x -= delta;
									if(this._entities[j].dx > 0) this._entities[j].dx = 0;
								}else{
									this._entities[i].x -= delta;
									if(this._entities[i].dx > 0) this._entities[i].dx = 0;
									this._entities[j].x += delta;
									if(this._entities[j].dx < 0) this._entities[j].dx = 0;
								}
							}else if(this._entities[j].eProp("anchor") && !this._entities[i].eProp("anchor")) {
								var delta = this._entities[i].prop("width") - Math.abs(this._entities[i].x - this._entities[j].x);
								if(this._entities[i].x > this._entities[j].x) {
									this._entities[i].x += delta;
									if(this._entities[i].dx < 0) this._entities[i].dx = 0;
								}else{
									this._entities[i].x -= delta;
									if(this._entities[i].dx > 0) this._entities[i].dx = 0;
								}
							}else if(!this._entities[j].eProp("anchor") && this._entities[i].eProp("anchor")) {
								var delta = this._entities[i].prop("width") - Math.abs(this._entities[i].x - this._entities[j].x);
								if(this._entities[j].x > this._entities[i].x) {
									this._entities[j].x += delta;
									if(this._entities[j].dx < 0) this._entities[j].dx = 0;
								}else{
									this._entities[j].x -= delta;
									if(this._entities[j].dx > 0) this._entities[j].dx = 0;
								}
							}	
						}
					}else{
						//Resolve vertically
						if(this._entities[i].y > this._entities[j].y) {
							this._entities[i].collideBottom(this._entities[j]);
							this._entities[j].collideTop(this._entities[i]);
						}else{
							this._entities[j].collideBottom(this._entities[i]);
							this._entities[i].collideTop(this._entities[j]);
						}
						
						if(this._entities[j].eProp("solid") && this._entities[i].eProp("solid")){ 
							if(!this._entities[j].eProp("anchor") && !this._entities[i].eProp("anchor")) {
								var delta = ((this._entities[i].prop("height") - Math.abs(this._entities[i].y - this._entities[j].y)) /2)+1;
								if(this._entities[i].y > this._entities[j].y) {
									this._entities[i].y += delta;
									if(this._entities[i].dy < 0) this._entities[i].dy = 0;
									this._entities[j].y -= delta;
									if(this._entities[j].dy > 0) this._entities[j].dy = 0;
								}else{
									this._entities[i].y -= delta;
									if(this._entities[i].dy > 0) this._entities[i].dy = 0;
									this._entities[j].y += delta;
									if(this._entities[j].dy < 0) this._entities[j].dy = 0;
								}
							}else if(this._entities[j].eProp("anchor") && !this._entities[i].eProp("anchor")) {
								var delta = this._entities[i].prop("height") - Math.abs(this._entities[i].y - this._entities[j].y);
								if(this._entities[i].y > this._entities[j].y) {
									this._entities[i].y += delta;
									if(this._entities[i].dy < 0) this._entities[i].dy = 0;
								}else{
									this._entities[i].y -= delta;
									if(this._entities[i].dy > 0) this._entities[i].dy = 0;
								}
							}else if(!this._entities[j].eProp("anchor") && this._entities[i].eProp("anchor")) {
								var delta = this._entities[i].prop("height") - Math.abs(this._entities[i].y - this._entities[j].y);
								if(this._entities[j].y > this._entities[i].y) {
									this._entities[j].y += delta;
									if(this._entities[j].dy < 0) this._entities[j].dy = 0;
								}else{
									this._entities[j].y -= delta;
									if(this._entities[j].dy > 0) this._entities[j].dy = 0;
								}
							}	
						}
					}
				}
			}
		}
	}
};

sgui.PlatMain.prototype.autoScroll = function(by) {
	// Center the player

	if(this.getComponent("entities") && this.path("entities/"+this._events.getVar("plat.seek"))){
		for(var i = by; i > 0; i--) {
			var fragile = false;
			
			if(this.path("entities/"+this._events.getVar("plat.seek")).x < Math.floor(((-this.x)+this.prop("width")/2)+1)) {
				if(!this.scrollRight()) break;
			}else if(this.path("entities/"+this._events.getVar("plat.seek")).x > Math.floor(((-this.x)+this.prop("width")/2)-1)) {
				if(!this.scrollLeft()) break;
			}else{
				break;
			}
		}
		
		for(var i = by; i > 0; i--) {
			if(this.path("entities/"+this._events.getVar("plat.seek")).y < Math.floor(((-this.y)+this.prop("height")/2)+1)) {
				if(!this.scrollDown()) break;
			}else if(this.path("entities/"+this._events.getVar("plat.seek")).y > Math.floor(((-this.y)+this.prop("height")/2)-1)) {
				if(!this.scrollUp()) break;
			}else{
				break;
			}
		}
		
		this._update();
	}
};

sgui.PlatMain.prototype._update = function() {
	if(this.x > 0) this.x = 0;
	if(this.y > 0) this.y = 0;
	
	this.getComponent("scheme").setBoundsCoord(-this.x, -this.y);
	this.getComponent("over").setBoundsCoord(-this.x, -this.y);
	this.getComponent("back").setBoundsCoord(-this.x, -this.y);
	
	this.getComponent("back").y = -this.y;
	this.getComponent("back").x = -this.x;
	
	this.getComponent("over").y = -this.y;
	this.getComponent("over").x = -this.x;
	
	this.getComponent("scheme").y = -this.y;
	this.getComponent("scheme").x = -this.x;
	
	this.bookRedraw();
};

sgui.PlatMain.prototype.scrollLeft = function() {
	if(this.getComponent("scheme").inRelativeRange(this.getComponent("scheme").visibleCols(), 0)){
		this.x --;
		return true;
	}
	
	return false;
};

sgui.PlatMain.prototype.scrollRight = function() {
	if(this.getComponent("scheme").inRelativeRange(0, 0)){
		this.x ++;
		return true;
	}
	
	return false;
};

sgui.PlatMain.prototype.scrollDown = function() {
	if(this.getComponent("scheme").inRelativeRange(0, 0)){
		this.y ++;
		return true;
	}
	
	return false;
};

sgui.PlatMain.prototype.scrollUp = function() {
	if(this.getComponent("scheme").inRelativeRange(0, this.getComponent("scheme").visibleRows())){
		this.y --;
		return true;
	}
	
	return false;
};
