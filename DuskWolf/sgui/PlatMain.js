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
		this._registerStuff(this._platMainStuff);
		
		this.setWidth(this._events.getVar("sys-sg-width"));
		this.setHeight(this._events.getVar("sys-sg-height"));
		
		this._tsize = this._theme("plat-tsize");
		this._ssize = this._theme("plat-ssize");
		this._scrollSpeed = this._theme("plat-scroll-speed");
		this._spawn = 0;
	}
};
sgui.PlatMain.prototype = new sgui.Group();
sgui.PlatMain.constructor = sgui.PlatMain;

sgui.PlatMain.prototype.className = "PlatMain";

sgui.PlatMain.prototype._platMainStuff = function(data) {
	this._spawn = this._prop("spacing-h", data, this._spawn, true, 0);
	this._ssize = this._prop("sprite-size", data, this._ssize, true, 0);
	this._tsize = this._prop("tile-size", data, this._tsize, true, 0);
	
	if(this._prop("load", data, null, false)){
		if(data.load.spawn != undefined) this._spawn = data.load.spawn;
		this.doStuff({"children":[
			{"name":"scheme", "type":"TileMap", "src":"pimg/schematics.png", "visible":false, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":this._events.getVar("proom-"+data.load.room+"-scheme"), "rows":this._events.getVar("proom-"+data.load.room+"-rows"), "cols":this._events.getVar("proom-"+data.load.room+"-cols")}, "width":this.getWidth(), "height":this.getHeight()},
			{"name":"back", "type":"TileMap", "src":this._events.getVar("proom-"+data.load.room+"-backSrc"), "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":this._events.getVar("proom-"+data.load.room+"-back"), "rows":this._events.getVar("proom-"+data.load.room+"-rows"), "cols":this._events.getVar("proom-"+data.load.room+"-cols")}, "width":this.getWidth(), "height":this.getHeight()},
			{"name":"entities", "type":"Group", "children":[
				{"name":"hero", "type":"PlatHero", "sprite-size":this._ssize, "width":1<<this._tsize, "height":1<<this._tsize, "src":"pimg/hero.png", "tile":"0,0"},
			]},
			{"name":"over", "type":"TileMap", "src":this._events.getVar("proom-"+data.load.room+"-overSrc"), "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":this._events.getVar("proom-"+data.load.room+"-over"), "rows":this._events.getVar("proom-"+data.load.room+"-rows"), "cols":this._events.getVar("proom-"+data.load.room+"-cols")}, "width":this.getWidth(), "height":this.getHeight()}
		]});
		
		var crd = this.getComponent("scheme").lookTile(this._spawn, 1);
		this.path("entities/hero").gridGo(crd[0], crd[1]);
		this.autoScroll(200);
	}
};

sgui.PlatMain.prototype._platMainFrame = function(e) {
	// Center the player
	this.autoScroll(this._scrollSpeed);
};

sgui.PlatMain.prototype.autoScroll = function(by) {
	// Center the player

	if(this.getComponent("entities")){
		for(var i = by; i > 0; i--) {
			var fragile = false;
			
			if(this.path("entities/hero").x < Math.floor(((-this.x)+this.getWidth()/2)+1)) {
				if(!this.scrollRight()) break;
			}else if(this.path("entities/hero").x > Math.floor(((-this.x)+this.getWidth()/2)-1)) {
				if(!this.scrollLeft()) break;
			}else{
				break;
			}
		}
		
		for(var i = by; i > 0; i--) {
			if(this.path("entities/hero").y < Math.floor(((-this.y)+this.getHeight()/2)+1)) {
				if(!this.scrollDown()) break;
			}else if(this.path("entities/hero").y > Math.floor(((-this.y)+this.getHeight()/2)-1)) {
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
