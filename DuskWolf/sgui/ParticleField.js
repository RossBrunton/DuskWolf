//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.ParticleField", (function() {
	var Component = load.require("dusk.sgui.Component");
	var core = load.require("dusk.sgui.effects.core");
	var sgui = load.require("dusk.sgui");
	
	/** @class dusk.sgui.ParticleField
	 * 
	 * @classdesc 
	 * 
	 * ParticleFields have the property `{@link dusk.sgui.Component#mousePierce}` set to true by default.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Component
	 * @constructor
	 */
	var ParticleField = function(parent, comName) {
		Component.call(this, parent, comName);
		
		//[r+g, b+a, x, y, xscratch+dx, yscratch+dy, dxscratch+ddx, dyscratch+ddy, dxlimit+dylimit, lifespan, dalphadecay]
		this._field = null;
		
		this._highest = 0;
		this._pixels = 0;
		this.stat = false;
		
		//Prop masks
		
		//Default values
		this.augment.listen((function(e) {
			this.mouse.clickPierce = true;
		}).bind(this), {"augment":"mouse"});
		
		//Listeners
		this.prepareDraw.listen(this._pfDraw, this);
		this.frame.listen(this._pfFrame, this);
		
		this.createField(1 << 16);
	};
	ParticleField.prototype = Object.create(Component.prototype);

	ParticleField.prototype._pfFrame = function(e) {
		for(var i = 0; i <= this._highest; i += 11) {
			if((this._field[i+1] & 0x00ff) != 0) {
				//Dx and dy
				this._field[i+4] += Math.abs((this._field[i+4] & 0xff) - 0x80) << 8;
				this._field[i+5] += Math.abs((this._field[i+5] & 0xff) - 0x80) << 8;
				
				this._field[i+2] += (this._field[i+4] >> 13) * (this._field[i+4] & 0x80 ? 1 : -1);
				this._field[i+3] += (this._field[i+5] >> 13) * (this._field[i+5] & 0x80 ? 1 : -1);
				
				this._field[i+4] &= 0x1fff;
				this._field[i+5] &= 0x1fff;
				
				//Ddx and ddy
				this._field[i+6] += Math.abs((this._field[i+6] & 0xff) - 0x80) << 8;
				this._field[i+7] += Math.abs((this._field[i+7] & 0xff) - 0x80) << 8;
				
				this._field[i+4] += (this._field[i+6] >> 14) * (this._field[i+6] & 0x80 ? 1 : -1);
				this._field[i+5] += (this._field[i+7] >> 14) * (this._field[i+7] & 0x80 ? 1 : -1);
				
				this._field[i+4] &= 0x3fff;
				this._field[i+5] &= 0x3fff;
				
				//Limits
				if((this._field[i+6] & 0xff) != 0x80
				&& ((((this._field[i+6] & 0x80)) && ((this._field[i+4] & 0xff) > (this._field[i+8] >> 8)))
				  || ((!(this._field[i+6] & 0x80)) && ((this._field[i+4] & 0xff) < (this._field[i+8] >> 8)))
				))
					this._field[i+4] = (this._field[i+8] >> 8) | (this._field[i+4] & 0xff00);
				
				if((this._field[i+7] & 0xff) != 0x80
				&& ((((this._field[i+7] & 0x80)) && ((this._field[i+5] & 0xff) > (this._field[i+8] & 0xff)))
				  || ((!(this._field[i+7] & 0x80)) && ((this._field[i+5] & 0xff) < (this._field[i+8] & 0xff)))
				))
					this._field[i+5] = (this._field[i+8] & 0xff) | (this._field[i+5] & 0xff00);
				
				//Lifespan and alpha decay
				if(this._field[i+9] > 0) {
					this._field[i+9] --;
				}else{
					if(this._field[i+10] > (this._field[i+1] & 0xff)) {
						this._field[i+1] = 0;
					}else{
						this._field[i+1] -= this._field[i+10];
					}
				} 
			}
		}
		
		return e;
	};

	ParticleField.prototype._pfDraw = function(e) {
		var c = null;
		/*if(this._highest > (10000 * 11)) var c = e.c.getImageData(e.d.destX, e.d.destY, e.d.width, e.d.height);*/
		// Doesn't work with alpha (sets alpha of background, rather than of pixel)
		
		//if(this.stat) for(var i = c.data.length -1; i >= 0; i --) {
		//	//c.data[i] = Math.random() * 256;
		//	e.c.fillStyle = ("#"+~~(Math.random() * (1 >> 16))).toString("16");
		//}
		
		for(var i = this._highest; i >= 0; i -= 11) {
			if((this._field[i+1] & 0x00ff) != 0) {
				var translatedX = this._field[i+2] - e.d.sourceX;
				var translatedY = this._field[i+3] - e.d.sourceY;
				
				if(this._field[i+2] >= e.d.sourceX && this._field[i+3] >= e.d.sourceY
				&& this._field[i+2] < e.d.sourceX + e.d.width && this._field[i+3] < e.d.sourceY + e.d.height) {
					if(c) {
						var origin = (translatedX + (translatedY * e.d.width)) * 4;
						c.data[origin] = this._field[i] >> 8;
						c.data[origin+1] = this._field[i] & 0xff;
						c.data[origin+2] = this._field[i+1] >> 8;
						c.data[origin+3] = this._field[i+1] & 0xff;
					}else{
						e.c.fillStyle =
						"rgba(" + (this._field[i] >> 8) + ", " + (this._field[i] & 0xff) + ", " +
						(this._field[i+1] >> 8) + ", " + ((this._field[i+1] & 0xff)/255) + ")";
					
						e.c.fillRect(translatedX, translatedY, 1, 1);
					}
				}
			}else if(this._highest == i) {
				this._highest -= 11;
			}
		}
		
		if(c) e.c.putImageData(c, e.d.destX, e.d.destY);
		
		return e;
	};

	ParticleField.prototype.inject =
		function(r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay) {
		if(a == 0) return;
		
		for(var i = 0; i < this._pixels; i += 11) {
			if((this._field[i+1] & 0x00ff) == 0) {
				if(i > this._highest) this._highest = i;
				this._field[i] = (r << 8) | g;
				this._field[i+1] = (b << 8) | a;
				this._field[i+2] = x;
				this._field[i+3] = y;
				this._field[i+4] = (dx * 0x20) + 0x80;
				this._field[i+5] = (dy * 0x20) + 0x80;
				this._field[i+6] = (ddx * 0x40) + 0x80;
				this._field[i+7] = (ddy * 0x40) + 0x80;
				this._field[i+8] = (((dxlimit * 0x20) + 0x80) << 8) + ((dylimit * 0x20) + 0x80);
				this._field[i+9] = lifespan;
				this._field[i+10] = decay;
				break;
			}
		}
	}

	ParticleField.prototype.createField = function(pixels) {
		this._field = new Uint16Array(pixels * 11);
		this._highest = 0;
		this._pixels = pixels * 11;
	};

	ParticleField.prototype.deRange = function(val, def) {
		if(Array.isArray(val)) {
			return (Math.random()*(val[1]-val[0])) + val[0];
		}else if(val === null || val === undefined) {
			return this.deRange(def);
		}
		
		return val;
	};

	ParticleField.prototype.applyEffect = function(name, data) {
		data.name = name;
		if(core.getEffect(name)) {
			core.getEffect(name)(this, data);
		}else{
			console.warn("Effect "+name+" not found!");
		}
	};

	ParticleField.prototype.loadBM = function(data) {};
	ParticleField.prototype.saveBM = function() {return {}};

	Object.seal(ParticleField);
	Object.seal(ParticleField.prototype);

	sgui.registerType("ParticleField", ParticleField);
	
	return ParticleField;
})());
