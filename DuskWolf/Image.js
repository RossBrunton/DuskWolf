//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");

dusk.load.provide("dusk.Image");

/* @class dusk.Image
 * 
 * @classdesc 
 * 
 * @param {string} src The src for the image.
 * @param {?string} options 
 * @since 0.0.14-alpha
 * @constructor
 */
dusk.Image = function(src, transform) {
	var frags = src.split(" ");
	
	this.src = dusk.utils.resolveRelative(frags[0], dusk.dataDir);
	this.providedSrc = src;
	
	this.transform = transform?dusk.Image.parseTransString(transform):[];
	if(frags.length > 1) this.transform += frags[1];
	
	this._proxy = null;
	if(this.src in dusk.Image._images) {
		this._proxy = dusk.Image._images[this.src];
	}else{
		dusk.Image._images[this.src] = this;
	}
	
	this._img = null;
	this._loadPromise = null;
	this._base = null;
	this._transformCache = {};
	if(!this._proxy) {
		this._img = new Image();
		this._img.src = this.src;
		var img = this._img;
		
		this._loadPromise = new Promise(function(resolve, reject) {
			img.onload = function() {
				resolve(true);
			}
			
			img.onerror = function(e) {
				reject(e);
			}
		});
		
		this._loadPromise.then((function(value) {
			this._base = dusk.utils.createCanvas(this._img.width, this._img.height);
			this._base.getContext("2d").drawImage(this._img, 0, 0, this._img.width, this._img.height,
				0, 0, this._img.width, this._img.height
			);
			this._img = null;
		}).bind(this));
	}
};

dusk.Image.prototype.loadPromise = function() {
	if(this._proxy) return this._proxy.loadPromise();
	return this._loadPromise;
};

dusk.Image.prototype.asCanvas = function(extraTrans, ignoreNormalTrans) {
	if(this._proxy) return this._proxy.asCanvas(this.transform.concat(extraTrans?extraTrans:[]), true);
	
	var opts = dusk.Image.parseTags((ignoreNormalTrans?[]:this.transform).concat(extraTrans?extraTrans:[]));
	
	if(!this._base) return null;
	
	if(!opts.us) {
		return this._base;
	}else if(opts.us in this._transformCache) {
		return this._transformCache[opts.us];
	}else{
		var can = dusk.utils.createCanvas(this._base.width, this._base.height);
		var ctx = can.getContext("2d");
		ctx.drawImage(this._base, 0, 0, this._base.width, this._base.height, 0, 0, this._base.width, this._base.height);
		
		var id = ctx.getImageData(0, 0, can.width, can.height);
		for(var u = 0; u < opts.us.length; u ++) {
			switch(opts.us.charAt(u)) {
				
				case "m":
					var g = 0;
					for(var i = 0; i < id.data.length; i += 4) {
						g = id.data[i] * 0.3 + id.data[i+1] * 0.59 + id.data[i+2] * 0.11;
						
						id.data[i] = g;
						id.data[i+1] = g;
						id.data[i+2] = g;
					}
					break;
				
				case "#":
					for(var i = 0; i < id.data.length; i += 4) {
						if(Math.random() > opts.cor) {
							id.data[i+3] = 0;
						}
					}
					break;
				
				default:
					//Ignore
			}
		}
		ctx.putImageData(id, 0, 0);
		
		this._transformCache[opts.us] = can;
		return can;
	}
};

dusk.Image.prototype.paint = function(ctx, extraTrans, ino, ox, oy, owidth, oheight, dx, dy, dwidth, dheight) {
	if(this._proxy) {
		this._proxy.paint(ctx, this.transform.concat(extraTrans),true,ox,oy, owidth, oheight, dx, dy, dwidth, dheight);
	}else{
		ctx.drawImage(this.asCanvas(extraTrans, ino), ox, oy, owidth, oheight, dx, dy, dwidth, dheight);
	}
};

dusk.Image.prototype.paintScaled = function
	(ctx, extraTrans, ino, ox, oy, owidth, oheight, dx, dy, dwidth, dheight, sx, sy) {
	
	this.paint(ctx, extraTrans, ino,
		ox * sx, oy * sy, owidth * sx, oheight * sy,
		dx, dy, dwidth, dheight
	);
};

dusk.Image.prototype.isReady = function() {
	if(this._proxy) return this._proxy.isReady();
	return this._base !== null;
};

dusk.Image.prototype.width = function() {
	if(this._proxy) return this._proxy.width();
	if(!this._base) return 0;
	return this._base.width;
};

dusk.Image.prototype.height = function() {
	if(this._proxy) return this._proxy.height();
	if(!this._base) return 0;
	return this._base.height;
};

dusk.Image.parseTransString = function(str) {
	var out = str.split(";");
	for(var i = 0; i < out.length; i ++) {
		out[i] = out[i].split(":");
	}
	return out;
};

dusk.Image.parseTags = function(trans) {
	var out = {};
	
	var p = trans.length-1;
	
	while(p >= 0) {
		if(trans[p][0] == "mono") {
			out.mono = true;
		}
		
		if(trans[p][0] == "cor") {
			out.cor = +trans[p][1];
		}
		
		p --;
	}
	
	out.us = "";
	
	if("mono" in out) out.us += "m";
	if("cor" in out) out.us += "#"+out.cor;
	
	return out;
};


/** Returns a string representation of the Image.
 * 
 * @return {string} A representation of the Image.
 */
dusk.Image.prototype.toString = function() {
	return "[Image "+this.src+"]";
};

dusk.Image._images = {};

Object.seal(dusk.Image);
Object.seal(dusk.Image.prototype);
