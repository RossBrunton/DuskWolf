//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FancyRect", (function() {
	var Rect = load.require("dusk.sgui.Rect");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var Image = load.require("dusk.Image");
	var utils = load.require("dusk.utils");

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
	var FancyRect = function (parent, comName) {
		Rect.call(this, parent, comName);
		
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
		this._registerPropMask("back", "back", true);
		this._registerPropMask("top", "top", true);
		this._registerPropMask("bottom", "bottom", true);
		this._registerPropMask("left", "left", true);
		this._registerPropMask("right", "right", true);
		this._registerPropMask("topLeft", "topLeft", true);
		this._registerPropMask("topRight", "topRight", true);
		this._registerPropMask("bottomLeft", "bottomLeft", true);
		this._registerPropMask("bottomRight", "bottomRight", true);
		
		//Listeners
		this.prepareDraw.listen(this._fancyRectDraw.bind(this));
	};
	FancyRect.prototype = Object.create(Rect.prototype);

	/** A draw handler which draws the fancy rectangle.
	 * @param {object} e A draw event.
	 * @private
	 */
	FancyRect.prototype._fancyRectDraw = function(e) {
		if(this._cacheSig() != this._cacheValue) {
			this._cacheValue = this._cacheSig();
			this._cache.width = this.width;
			this._cache.height = this.height;
			var ctx = this._cache.getContext("2d");
			
			ctx.strokeStyle = this.bColour;
			ctx.lineWidth = this.bWidth;
			
			//Background
			if(this._back && this._back.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._back.asCanvas(), 'repeat');
				
				var n = utils.clone(e);
				
				n.d.destX = 0;
				n.d.destY = 0;
				n.c = ctx;
				
				this._fill(n);
			}
			
			ctx.lineWidth = 0;
			
			//Edges
			if(this._top && this._top.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._top.asCanvas(), 'repeat-x');
				ctx.fillRect(0, 0, this.width, this._top.height());
			}
			
			if(this._left && this._left.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._left.asCanvas(), 'repeat-y');
				ctx.fillRect(0, 0, this._left.width(), this.height);
			}
			
			if(this._bottom && this._bottom.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._bottom.asCanvas(), 'repeat-x');
				
				ctx.translate(0, this.height - this._bottom.height());
				ctx.fillRect(0, 0, this.width, this._bottom.height());
				ctx.translate(0, -(this.height - this._bottom.height()));
			}
			
			if(this._right && this._right.isReady()) {
				ctx.fillStyle = ctx.createPattern(this._right.asCanvas(), 'repeat-y');
				
				ctx.translate(this.width - this._right.width(), 0);
				ctx.fillRect(0, 0, this._right.width(), this.height);
				ctx.translate(-(this.width - this._right.width()), 0);
			}
			
			//Corners
			if(this._topLeft && this._topLeft.isReady()) {
				this._topLeft.paintFull(ctx, [], false,
					0, 0, this._topLeft.width(), this._topLeft.height()
				);
			}
			
			if(this._topRight && this._topRight.isReady()) {
				this._topRight.paintFull(ctx, [], false,
					this.width - this._topRight.width(), 0, this._topRight.width(), this._topRight.height()
				);
			}
			
			if(this._bottomLeft && this._bottomLeft.isReady()) {
				this._bottomLeft.paintFull(ctx, [], false,
					0, this.height-this._bottomLeft.height(), this._bottomLeft.width(), this._bottomLeft.height()
				);
			}
			
			if(this._bottomRight && this._bottomRight.isReady()) {
				this._bottomRight.paintFull(ctx, [], false,
					this.width - this._bottomRight.width(), this.height - this._bottomRight.height(),
					this._bottomRight.width(), this._bottomRight.height()
				);
			}
		}
		
		e.c.drawImage(this._cache, e.d.sourceX, e.d.sourceY, e.d.width,  e.d.height,
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	};

	FancyRect.prototype._cacheSig = function() {
		return this.x+","+this.y+","+this.height+","+this.width;
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

	Object.seal(FancyRect);
	Object.seal(FancyRect.prototype);

	sgui.registerType("FancyRect", FancyRect);
	
	return FancyRect;
})());
