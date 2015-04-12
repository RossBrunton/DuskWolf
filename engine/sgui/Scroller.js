//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Scroller", (function() {
	var FocusCheckerTile = load.require("dusk.sgui.FocusCheckerTile");
	var sgui = load.require("dusk.sgui");
	var controls = load.require("dusk.input.controls");
	var c = load.require("dusk.sgui.c");
	var Range = load.require("dusk.utils.Range");
	
	/** Creates a new Scroller.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * 
	 * @class dusk.sgui.Scroller
	 * 
	 * @classdesc A scroller is pretty much a scroll bar without the bar. When it is active, the
	 *  `{@link dusk.sgui.IContainer.horScroll}` or `{@link dusk.sgui.IContainer.horScroll}` of a container can be
	 *  altered using the arrow keys.
	 * 
	 * This component will also change it's x and y location, such that it is at the "normal" place on the container
	 *  that a scrollbar would be expected. At the bottom or right side of its target.
	 * 
	 * By default, a horizontal scrollbar has both tile and not-tile dimensions of 32*16, a horizontal focus order,
	 *  and a src of `default/scrollerHoz.png`. Vertical ones have dimensions of 16*32, a vertical focus order, and a
	 *  src of `default/ScrollerVer.png`.
	 * 
	 * @extends dusk.sgui.FocusCheckerTile
	 * @since 0.0.19-alpha
	 * @constructor
	 */
	var Scroller = function (parent, name) {
		FocusCheckerTile.call(this, parent, name);
		
		/** The orientation of the scroller. Vertical means it scrolls up and down, while horizontal means it scrolls left
		 *   and right.
		 * 
		 * Must be a `dusk.sgui.c.ORIENT_*` constant.
		 * @type integer
		 * @default dusk.sgui.c.ORIENT_VER
		 */
		this.orientation = c.ORIENT_VER;
		/** The target that this scroller is scrolling.
		 * 
		 * Must be a container, if set to a string, then the string will be interpreted as a path from this component.
		 * @type dusk.sgui.IContainer|string
		 */
		this.target = null;
		
		//Prop masks
		this._mapper.map("orientation", "orientation");
		this._mapper.map("target", "target");
		
		//Listeners
		this.frame.listen(this._sFrame.bind(this));
		this.dirPress.listen(this._sDir.bind(this));
	};
	Scroller.prototype = Object.create(FocusCheckerTile.prototype);
	
	/** Called every frame to update the coordianates and check for input.
	 * @param {object} e The event object.
	 * @private
	 */
	Scroller.prototype._sFrame = function(e) {
		if(!this.target) return;
		
		if(typeof this.target == "string") {
			this.target = this.path(this.target);
		}
		
		if(this.orientation == c.ORIENT_HOR) {
			if(controls.controlActive("sgui_left") && this.active) {
				this.target.horScroll.value -= this.target.horScroll.stepDown / 60;
			}
			if(controls.controlActive("sgui_right") && this.active) {
				this.target.horScroll.value += this.target.horScroll.stepUp / 60;
			}
			
			if(this.target.horScroll == null) this.target.horScroll = new Range(0.0, 1.0, 0.0, 0.1, 0.1);
			
			this.y = this.target.y + this.target.height - this.height;
			this.x = this.target.x +~~(((this.target.width - this.width) * this.target.horScroll.getFraction()));
		}else{
			if(controls.controlActive("sgui_up") && this.active) {
				this.target.verScroll.value -= this.target.verScroll.stepDown / 60;
			}
			if(controls.controlActive("sgui_down") && this.active) {
				this.target.verScroll.value += this.target.verScroll.stepUp / 60;
			}
			
			if(this.target.verScroll == null) this.target.verScroll = new Range(0.0, 1.0, 0.0, 0.1, 0.1);
			this.x = this.target.x + this.target.width - this.width;
			this.y = this.target.y + ~~(((this.target.height - this.height) * this.target.verScroll.getFraction()));
		}
	};
	
	/** Called on direction, supresses key behaviour if it would move the scroller.
	 * @param {object} e The event object.
	 * @private
	 */
	Scroller.prototype._sDir = function(e) {
		if(!this.active) return true;
		if(this.orientation == c.ORIENT_HOR) {
			if(e.dir == c.DIR_RIGHT || e.dir == c.DIR_LEFT) {
				return false;
			}
		}else if(this.orientation == c.ORIENT_VER) {
			if(e.dir == c.DIR_UP || e.dir == c.DIR_DOWN) {
				return false;
			}
		}
		return true;
	};
	
	sgui.registerType("Scroller", Scroller);
	
	sgui.addStyle("Scroller[orientation="+c.ORIENT_VER+"]", {
		"height":32,
		"width":16,
		"focusOrient":c.ORIENT_HOR,
		"swidth":16,
		"sheight":32,
		"src":"default/scrollerVer.png"
	});
	
	sgui.addStyle("Scroller[orientation="+c.ORIENT_HOR+"]", {
		"height":16,
		"width":32,
		"focusOrient":c.ORIENT_VER,
		"swidth":32,
		"sheight":16,
		"src":"default/scrollerHor.png"
	});
	
	return Scroller;
})());
