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
		if(data.load.spawn) this._spawn = data.spawn;
		
		this.doStuff({"children":[
			{"name":"scheme", "type":"TileMap", "src":"schematics.png", "tile-size":this._tsize, "map":{"map":this._events.getVar("proom-"+data.load.room+"-scheme"), "sprite-size":this._ssize, "rows":this._events.getVar("proom-"+data.load.room+"-rows"), "cols":this._events.getVar("proom-"+data.load.room+"-cols")}, "width":this.getWidth(), "height":this.getHeight()},
			{"name":"visible", "type":"TileMap", "tile-size":this._tsize, "width":this.getWidth(), "height":this.getHeight()},
			{"name":"hero", "type":"PlatHero", "sprite-size":this._ssize, "width":1<<this._tsize, "height":1<<this._tsize, "src":"hero.png", "tile":"0,0"},
		]});
		
		var crd = this.getComponent("scheme").lookTile(this._spawn, 1).split(",");
		this.getComponent("hero").gridGo(crd[0], crd[1]);
	}
};

sgui.PlatMain.prototype._platMainFrame = function(e) {
	// Center the player
	if(this.getComponent("hero")){
		for(var i = this._scrollSpeed; i > 0; i--) {
			if(this.getComponent("hero").x < (-this.x)+this.getWidth()/2) {
				this.scrollRight();
			}else if(this.getComponent("hero").x > (-this.x)+this.getWidth()/2) {
				this.scrollLeft();
			}
			
			if(this.getComponent("hero").y < (-this.y)+this.getHeight()/2) {
				this.scrollDown();
			}else if(this.getComponent("hero").y > (-this.y)+this.getHeight()/2) {
				this.scrollUp();
			}
		}
	}
};

sgui.PlatMain.prototype._update = function() {
	if(this.x > 0) this.x = 0;
	if(this.y > 0) this.y = 0;
	
	this.getComponent("scheme").setBoundsCoord(-this.x, -this.y);
	this.getComponent("visible").setBoundsCoord(-this.x, -this.y);
	
	this.bookRedraw();
};

sgui.PlatMain.prototype.scrollLeft = function(by) {
	if(by === undefined) by = 1;
	if(by === 0) return true;
	
	if(this.getComponent("scheme").getRelativeTile(this.getComponent("scheme").visibleCols(), 0)){
		this.x --;
		this._update();
		this.scrollLeft(by-1);
		return true;
	}
	
	return false;
};

sgui.PlatMain.prototype.scrollRight = function(by) {
	if(by === undefined) by = 1;
	if(by === 0) return true;
	
	if(this.getComponent("scheme").getRelativeTile(0, 0)){
		this.x ++;
		this._update();
		this.scrollRight(by-1);
		return true;
	}
	
	return false;
};

sgui.PlatMain.prototype.scrollDown = function(by) {
	if(by === undefined) by = 1;
	if(by === 0) return true;
	
	if(this.getComponent("scheme").getRelativeTile(0, 0)){
		this.y ++;
		this._update();
		this.scrollDown(by-1);
		return true;
	}
	
	return false;
};

sgui.PlatMain.prototype.scrollUp = function(by) {
	if(by === undefined) by = 1;
	if(by === 0) return true;
	
	if(this.getComponent("scheme").getRelativeTile(0, this.getComponent("scheme").visibleRows())){
		this.y --;
		this._update();
		this.scrollUp(by-1);
		return true;
	}
	
	return false;
};
