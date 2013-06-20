//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.FocusCheckerTile");
dusk.load.require("dusk.controls");

dusk.load.provide("dusk.sgui.Scroller");

/** Creates a new Scroller.
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.Scroller
 * 
 * @classdesc A scroller is pretty much a scroll bar without the bar. When it is active, the
 *  `{@link dusk.sgui.IContainer.horScroll}` or `{@link dusk.sgui.IContainer.horScroll}` of a container can be altered
 *  using the arrow keys.
 * 
 * This component will also change it's x and y location, such that it is at the "normal" place on the container that
 *  a scrollbar would be expected. At the bottom or right side of its target.
 * 
 * By default, a horizontal scrollbar has both tile and not-tile dimensions of 32*16, a horizontal focus order,
 *  and a src of `sgui/scrollerHoz.png`. Vertical ones have dimensions of 16*32, a vertical focus order, and a src of 
 *  `sgui/ScrollerVer.png`.
 * 
 * @extends dusk.sgui.FocusCheckerTile
 * @since 0.0.19-alpha
 * @constructor
 */
dusk.sgui.Scroller = function (parent, comName) {
	dusk.sgui.FocusCheckerTile.call(this, parent, comName);
	
	/** The orientation of the scroller. Vertical means it scrolls up and down, while horizontal means it scrolls left
	 *   and right.
	 * 
	 * Must be a `dusk.sgui.c.ORIENT_*` constant.
	 * @type integer
	 * @default dusk.sgui.c.ORIENT_VER
	 */
	this.orientation = dusk.sgui.c.ORIENT_VER;
	/** The target that this scroller is scrolling.
	 * 
	 * Must be a container, if set to a string, then the string will be interpreted as a path from this component.
	 * @type dusk.sgui.IContainer|string
	 */
	this.target = null;
	
	//Prop masks
	this._registerPropMask("orientation", "orientation");
	this._registerPropMask("target", "target");
	
	//Listeners
	this.frame.listen(this._sFrame, this);
	this.dirPress.listen(this._sDir, this);
	
	//Defaults
	this.allowMouse = true;
};
dusk.sgui.Scroller.prototype = Object.create(dusk.sgui.FocusCheckerTile.prototype);

dusk.sgui.Scroller.prototype.className = "Scroller";

/** Called every frame to update the coordianates and check for input.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.Scroller.prototype._sFrame = function(e) {
	if(!this.target) return;
	if(typeof this.target == "string") {
		this.target = this.path(this.target);
	}
	
	if(this.orientation == dusk.sgui.c.ORIENT_HOR) {
		if(dusk.controls.controlActive("sgui_left") && this._active) {
			this.target.horScroll.value -= this.target.horScroll.stepDown / dusk.frameRate;
		}
		if(dusk.controls.controlActive("sgui_right") && this._active) {
			this.target.horScroll.value += this.target.horScroll.stepUp / dusk.frameRate;
		}
		
		if(this.target.horScroll == null) this.target.horScroll = new dusk.Range(0.0, 1.0, 0.0, 0.1, 0.1);
		this.y = this.target.y + this.target.height - this.height;
		this.x = this.target.x +~~(((this.target.width - this.width) * this.target.horScroll.getFraction()));
	}else{
		if(dusk.controls.controlActive("sgui_up") && this._active) {
			this.target.verScroll.value -= this.target.verScroll.stepDown / dusk.frameRate;
		}
		if(dusk.controls.controlActive("sgui_down") && this._active) {
			this.target.verScroll.value += this.target.verScroll.stepUp / dusk.frameRate;
		}
		
		if(this.target.verScroll == null) this.target.verScroll = new dusk.Range(0.0, 1.0, 0.0, 0.1, 0.1);
		this.x = this.target.x + this.target.width - this.width;
		this.y = this.target.y + ~~(((this.target.height - this.height) * this.target.verScroll.getFraction()));
	}
};

/** Called on direction, supresses key behaviour if it would move the scroller.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.Scroller.prototype._sDir = function(e) {
	if(!this._active) return true;
	if(this.orientation == dusk.sgui.c.ORIENT_HOR) {
		if(e.dir == dusk.sgui.c.DIR_RIGHT || e.dir == dusk.sgui.c.DIR_LEFT) {
			return false;
		}
	}else if(this.orientation == dusk.sgui.RangeText.ORIENT_VER) {
		if(e.dir == dusk.sgui.c.DIR_UP || e.dir == dusk.sgui.c.DIR_DOWN) {
			return false;
		}
	}
	return true;
};

Object.seal(dusk.sgui.Scroller);
Object.seal(dusk.sgui.Scroller.prototype);

dusk.sgui.registerType("Scroller", dusk.sgui.Scroller);
dusk.sgui.addStyle("Scroller[orientation="+dusk.sgui.c.ORIENT_VER+"]", {
	"height":32,
	"width":16,
	"focusOrient":dusk.sgui.c.ORIENT_HOR,
	"swidth":16,
	"sheight":32,
	"src":"sgui/scrollerVer.png"
});
dusk.sgui.addStyle("Scroller[orientation="+dusk.sgui.c.ORIENT_HOR+"]", {
	"height":16,
	"width":32,
	"focusOrient":dusk.sgui.c.ORIENT_VER,
	"swidth":32,
	"sheight":16,
	"src":"sgui/scrollerHor.png"
});
