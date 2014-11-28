//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FancyRect", (function() {
	var Rect = load.require("dusk.sgui.Rect");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var Image = load.require("dusk.utils.Image");
	var utils = load.require("dusk.utils");
	var PosRect = load.require("dusk.utils.PosRect");
	
	/* Creates a new FancyRect.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * 
	 * @class dusk.sgui.FancyRect
	 * 
	 * @classdesc A simple rectangle.
	 * 	It sets all the area specified by it's `height` and `width`,
	 *  and colours it in a single colour with an optional border.
	 * 
	 * @extends dusk.sgui.Component
	 * @constructor
	 */
	var FancyRect = function (parent, name) {
		Rect.call(this, parent, name);
		
		this._back = null;
		this._top = null;
		this._bottom = null;
		this._left = null;
		this._right = null;
		this._topLeft = null;
		this._topRight = null;
		this._bottomLeft = null;
		this._bottomRight = null;
		
		this.back = "";
		this.top = "";
		this.bottom = "";
		this.left = "";
		this.right = "";
		this.topLeft = "";
		this.topRight = "";
		this.bottomRight = "";
		this.bottomLeft = "";
		
		this._cache = utils.createCanvas(0, 0);
		this._cacheValue = "";
		
		//Prop masks
		this._mapper.map("back", "back");
		this._mapper.map("top", "top");
		this._mapper.map("bottom", "bottom");
		this._mapper.map("left", "left");
		this._mapper.map("right", "right");
		this._mapper.map("topLeft", "topLeft");
		this._mapper.map("topRight", "topRight");
		this._mapper.map("bottomLeft", "bottomLeft");
		this._mapper.map("bottomRight", "bottomRight");
		
		//Listeners
		this.prepareDraw.listen(this._fancyRectDraw.bind(this));
	};
	FancyRect.prototype = Object.create(Rect.prototype);
	
	/** A draw handler which draws the fancy rectangle.
	 * @param {object} e A draw event.
	 * @private
	 */
	FancyRect.prototype._fancyRectDraw = function(e) {
		if(this._cacheSig(e) != this._cacheValue) {
			this._cacheValue = this._cacheSig(e);
			this._cache.width = e.d.dest.width;
			this._cache.height = e.d.dest.height;
			var ctx = this._cache.getContext("2d");
			
			ctx.strokeStyle = this.bColour;
			ctx.lineWidth = this.bWidth;
			
			//Background
			if(this._back && this._back.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._back.asCanvas(), 'repeat');
				
				var n = {};
				
				n.d = {};
				n.d.origin = e.d.origin;
				n.d.dest = PosRect.pool.alloc().setWH(0, 0, e.d.dest.width, e.d.dest.height);
				n.d.slice = e.d.slice;
				n.c = ctx;
				
				this._fill(n);
				
				PosRect.pool.free(n.d.dest);
			}
			
			ctx.lineWidth = 0;
			
			//Edges
			if(this._top && this._top.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._top.asCanvas(), 'repeat-x');
				ctx.fillRect(0, 0, e.d.dest.width, this._top.height());
			}
			
			if(this._left && this._left.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._left.asCanvas(), 'repeat-y');
				ctx.fillRect(0, 0, this._left.width(), e.d.dest.height);
			}
			
			if(this._bottom && this._bottom.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._bottom.asCanvas(), 'repeat-x');
				
				ctx.translate(0, e.d.dest.height - this._bottom.height());
				ctx.fillRect(0, 0, e.d.dest.width, this._bottom.height());
				ctx.translate(0, -(e.d.dest.height - this._bottom.height()));
			}
			
			if(this._right && this._right.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._right.asCanvas(), 'repeat-y');
				
				ctx.translate(e.d.dest.width - this._right.width(), 0);
				ctx.fillRect(0, 0, this._right.width(), e.d.dest.height);
				ctx.translate(-(e.d.dest.width - this._right.width()), 0);
			}
			
			//Corners
			if(this._topLeft && this._topLeft.isReady()) {
				this._topLeft.paintFull(ctx, [], false,
					0, 0, this._topLeft.width(), this._topLeft.height()
				);
			}
			
			if(this._topRight && this._topRight.isReady()) {
				this._topRight.paintFull(ctx, [], false,
					e.d.dest.width - this._topRight.width(), 0, this._topRight.width(), this._topRight.height()
				);
			}
			
			if(this._bottomLeft && this._bottomLeft.isReady()) {
				this._bottomLeft.paintFull(ctx, [], false,
					0, e.d.dest.height-this._bottomLeft.height(), this._bottomLeft.width(), this._bottomLeft.height()
				);
			}
			
			if(this._bottomRight && this._bottomRight.isReady()) {
				this._bottomRight.paintFull(ctx, [], false,
					e.d.dest.width - this._bottomRight.width(), e.d.dest.height - this._bottomRight.height(),
					this._bottomRight.width(), this._bottomRight.height()
				);
			}
		}
		
		e.c.drawImage(this._cache, e.d.slice.x, e.d.slice.y, e.d.slice.width,  e.d.slice.height,
			e.d.dest.x, e.d.dest.y, e.d.dest.width, e.d.dest.height
		);
	};
	
	/** Checks if all images are ready.
	 * @return {boolean} False if an image isn't ready.
	 * @protected
	 */
	FancyRect.prototype._everythingReady = function() {
		return (!this._back || this._back.isReady()) &&
			(!this._top || this._top.isReady()) &&
			(!this._bottom || this._bottom.isReady()) &&
			(!this._left || this._left.isReady()) &&
			(!this._right || this._right.isReady()) &&
			(!this._topLeft || this._topLeft.isReady()) &&
			(!this._topRight || this._topRight.isReady()) &&
			(!this._bottomLeft || this._bottomLeft.isReady()) &&
			(!this._bottomRight || this._bottomRight.isReady());
			
	}
	
	FancyRect.prototype._cacheSig = function(e) {
		return this.x+","+this.y+","+e.d.dest.height+","+e.d.dest.width+","+this._everythingReady();
	};
	
	//back
	Object.defineProperty(FancyRect.prototype, "back", {
		get: function() {return this._back?this._back.providedSrc:"";},
		set: function(value) {this._back = value?new Image(value):null;}
	});
	
	//top
	Object.defineProperty(FancyRect.prototype, "top", {
		get: function() {return this._top?this._top.providedSrc:"";},
		set: function(value) {this._top = value?new Image(value):null;}
	});
	
	//bottom
	Object.defineProperty(FancyRect.prototype, "bottom", {
		get: function() {return this._bottom?this._bottom.providedSrc:"";},
		set: function(value) {this._bottom = value?new Image(value):null;}
	});
	
	//left
	Object.defineProperty(FancyRect.prototype, "left", {
		get: function() {return this._left?this._left.providedSrc:"";},
		set: function(value) {this._left = value?new Image(value):null;}
	});
	
	//right
	Object.defineProperty(FancyRect.prototype, "right", {
		get: function() {return this._right?this._right.providedSrc:"";},
		set: function(value) {this._right = value?new Image(value):null;}
	});
	
	//topLeft
	Object.defineProperty(FancyRect.prototype, "topLeft", {
		get: function() {return this._topLeft?this._topLeft.providedSrc:"";},
		set: function(value) {this._topLeft = value?new Image(value):null;}
	});
	
	//topRight
	Object.defineProperty(FancyRect.prototype, "topRight", {
		get: function() {return this._topRight?this._topRight.providedSrc:"";},
		set: function(value) {this._topRight = value?new Image(value):null;}
	});
	
	//bottomLeft
	Object.defineProperty(FancyRect.prototype, "bottomLeft", {
		get: function() {return this._bottomLeft?this._bottomLeft.providedSrc:"";},
		set: function(value) {this._bottomLeft = value?new Image(value):null;}
	});
	
	//bottomRight
	Object.defineProperty(FancyRect.prototype, "bottomRight", {
		get: function() {return this._bottomRight?this._bottomRight.providedSrc:"";},
		set: function(value) {this._bottomRight = value?new Image(value):null;}
	});
	
	sgui.registerType("FancyRect", FancyRect);
	
	return FancyRect;
})());
