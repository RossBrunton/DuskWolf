//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Rect");
dusk.load.require("dusk.utils");
dusk.load.require("dusk.Image");

dusk.load.provide("dusk.sgui.FancyRect");

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
dusk.sgui.FancyRect = function (parent, comName) {
	dusk.sgui.Rect.call(this, parent, comName);
	
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
	this.prepareDraw.listen(this._fancyRectDraw, this);
};
dusk.sgui.FancyRect.prototype = Object.create(dusk.sgui.Rect.prototype);

/** A draw handler which draws the fancy rectangle.
 * @param {object} e A draw event.
 * @private
 */
dusk.sgui.FancyRect.prototype._fancyRectDraw = function(e) {
	e.c.strokeStyle = this.bColour;
	e.c.lineWidth = this.bWidth;
	e.c.translate(e.d.destX, e.d.destY);
	
	//Background
	if(this._back && this._back.isReady()) {
		e.c.fillStyle = e.c.createPattern(this._back.asCanvas(), 'repeat');
		
		var n = dusk.utils.clone(e);
		
		n.d.destX = 0;
		n.d.destY = 0;
		
		this._fill(n);
	}
	
	e.c.lineWidth = 0;
	
	//Edges
	if(this._top && this._top.isReady()) {
		e.c.fillStyle = e.c.createPattern(this._top.asCanvas(), 'repeat-x');
		
		var n = dusk.utils.clone(e);
		
		n.d.destX = 0;
		n.d.destY = 0;
		n.d.height = this._top.height();
		
		this._fill(n);
	}
	
	if(this._left && this._left.isReady()) {
		e.c.fillStyle = e.c.createPattern(this._left.asCanvas(), 'repeat-y');
		
		var n = dusk.utils.clone(e);
		
		n.d.destX = 0;
		n.d.destY = 0;
		n.d.width = this._left.height();
		
		this._fill(n);
	}
	
	if(this._bottom && this._bottom.isReady()) {
		e.c.fillStyle = e.c.createPattern(this._bottom.asCanvas(), 'repeat-x');
		
		var n = dusk.utils.clone(e);
		
		n.d.destX = 0;
		n.d.destY = 0;
		n.d.height = this._bottom.height();
		
		e.c.translate(0, e.d.height - n.d.height);
		
		this._fill(n);
		e.c.translate(0, - e.d.height + n.d.height);
	}
	
	if(this._right && this._right.isReady()) {
		e.c.fillStyle = e.c.createPattern(this._right.asCanvas(), 'repeat-y');
		
		var n = dusk.utils.clone(e);
		
		n.d.destX = 0;
		n.d.destY = 0;
		n.d.width = this._right.width();
		
		e.c.translate(e.d.width - n.d.width, 0);
		this._fill(n);
		e.c.translate(- e.d.width + n.d.width, 0);
	}
	
	//Corners
	if(this._topLeft && this._topLeft.isReady()) {
		this._topLeft.paint(e.c, [], false,
			0, 0, this._topLeft.width(), this._topLeft.height(),
			0, 0, this._topLeft.width(), this._topLeft.height()
		);
	}
	
	if(this._topRight && this._topRight.isReady()) {
		this._topRight.paint(e.c, [], false,
			0, 0, this._topRight.width(), this._topRight.height(),
			e.d.width - this._topRight.width(), 0, this._topRight.width(), this._topRight.height()
		);
	}
	
	if(this._bottomLeft && this._bottomLeft.isReady()) {
		this._bottomLeft.paint(e.c, [], false,
			0, 0, this._bottomLeft.width(), this._bottomLeft.height(),
			0, e.d.height-this._bottomLeft.height(), this._bottomLeft.width(), this._bottomLeft.height()
		);
	}
	
	if(this._bottomRight && this._bottomRight.isReady()) {
		this._bottomRight.paint(e.c, [], false,
			0, 0, this._bottomRight.width(), this._bottomRight.height(),
			e.d.width - this._bottomRight.width(), e.d.height - this._bottomRight.height(),
			this._bottomRight.width(), this._bottomRight.height()
		);
	}
	
	e.c.translate(-e.d.destX, -e.d.destY);
};

//back
Object.defineProperty(dusk.sgui.FancyRect.prototype, "back", {
	get: function() {return this._back?this._back.providedSrc:"";},
	set: function(value) {this._back = value?new dusk.Image(value):null;}
});

//top
Object.defineProperty(dusk.sgui.FancyRect.prototype, "top", {
	get: function() {return this._top?this._top.providedSrc:"";},
	set: function(value) {this._top = value?new dusk.Image(value):null;}
});

//bottom
Object.defineProperty(dusk.sgui.FancyRect.prototype, "bottom", {
	get: function() {return this._bottom?this._bottom.providedSrc:"";},
	set: function(value) {this._bottom = value?new dusk.Image(value):null;}
});

//left
Object.defineProperty(dusk.sgui.FancyRect.prototype, "left", {
	get: function() {return this._left?this._left.providedSrc:"";},
	set: function(value) {this._left = value?new dusk.Image(value):null;}
});

//right
Object.defineProperty(dusk.sgui.FancyRect.prototype, "right", {
	get: function() {return this._right?this._right.providedSrc:"";},
	set: function(value) {this._right = value?new dusk.Image(value):null;}
});

//topLeft
Object.defineProperty(dusk.sgui.FancyRect.prototype, "topLeft", {
	get: function() {return this._topLeft?this._topLeft.providedSrc:"";},
	set: function(value) {this._topLeft = value?new dusk.Image(value):null;}
});

//topRight
Object.defineProperty(dusk.sgui.FancyRect.prototype, "topRight", {
	get: function() {return this._topRight?this._topRight.providedSrc:"";},
	set: function(value) {this._topRight = value?new dusk.Image(value):null;}
});

//bottomLeft
Object.defineProperty(dusk.sgui.FancyRect.prototype, "bottomLeft", {
	get: function() {return this._bottomLeft?this._bottomLeft.providedSrc:"";},
	set: function(value) {this._bottomLeft = value?new dusk.Image(value):null;}
});

//bottomRight
Object.defineProperty(dusk.sgui.FancyRect.prototype, "bottomRight", {
	get: function() {return this._bottomRight?this._bottomRight.providedSrc:"";},
	set: function(value) {this._bottomRight = value?new dusk.Image(value):null;}
});

Object.seal(dusk.sgui.FancyRect);
Object.seal(dusk.sgui.FancyRect.prototype);

dusk.sgui.registerType("FancyRect", dusk.sgui.FancyRect);
