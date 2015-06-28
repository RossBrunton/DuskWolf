//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.particles.sgui.ParticleField", (function() {
	var Component = load.require("dusk.sgui.Component");
	var core = load.require("dusk.particles.particleEffects.core");
	var sgui = load.require("dusk.sgui");
	var editor = load.suggest("dusk.rooms.editor", function(p) {editor = p;});
	
	/*
	 * 
	 * ParticleFields have the property `{@link dusk.sgui.Component#mousePierce}` set to true by default.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Component
	 * @constructor
	 */
	var ParticleField = function(parent, name) {
		Component.call(this, parent, name);
		
		//[r+g, b+a, x, y, xscratch+dx, yscratch+dy, dxscratch+ddx, dyscratch+ddy, dxlimit+dylimit, lifespan, dalphadecay]
		this._field = null;
		
		this._highest = 0;
		this._pixels = 0;
		this.stat = false;
		
		this._openSlots = null;
		this._osp = 0;
		
		this._rand = ~~(Math.random() * Number.MAX_SAFE_INTEGER);
		
		//Default values
		this.clickPierce = true;
		
		//Listeners
		this.onPaint.listen(_draw.bind(this));
		this.frame.listen(_frame.bind(this));
		
		this.createField(1 << 16);
		this.xDisplay = "expand";
		this.yDisplay = "expand";
	};
	ParticleField.prototype = Object.create(Component.prototype);
	
	var _frame = function(e) {
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
					var s = this._field[i+1] & 0x00ff;
					if(s <= this._field[i+10]) {
						this._field[i+1] = 0;
						this._openSlots[++this._osp] = i;
						if(i == this._highest) this._highest -= 11;
					}else{
						this._field[i+1] -= this._field[i+10];
					}
				} 
			}
		}
		
		return e;
	};
	
	var _draw = function(e) {
		var c = null;
		/*if(this._highest > (10000 * 11)) var c = e.c.getImageData(e.d.destX, e.d.destY, e.d.width, e.d.height);*/
		// Doesn't work with alpha (sets alpha of background, rather than of pixel)
		
		//if(this.stat) for(var i = c.data.length -1; i >= 0; i --) {
		//	//c.data[i] = Math.random() * 256;
		//	e.c.fillStyle = ("#"+~~(Math.random() * (1 >> 16))).toString("16");
		//}
		
		for(var i = this._highest; i >= 0; i -= 11) {
			if((this._field[i+1] & 0x00ff) != 0) {
				var translatedX = this._field[i+2] - e.d.slice.x + e.d.dest.x;
				var translatedY = this._field[i+3] - e.d.slice.y + e.d.dest.y;
				
				if(this._field[i+2] >= e.d.slice.x && this._field[i+3] >= e.d.slice.y
				&& this._field[i+2] < e.d.slice.ex && this._field[i+3] < e.d.slice.ey) {
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
		
		// Pointless fancy effect
		if(editor && editor.active && this.focused) {
			for(var j = (e.d.origin.width * e.d.origin.height) / 2000; j > 0; j --) {
				this.inject(
					0, 0, 0, 100, this.random(0, e.d.origin.width), this.random(0, e.d.origin.height),
					1, 1, 0, 0, 0, 0, 0, 5
				);
			}
		}
		
		if(c) e.c.putImageData(c, e.d.dest.x, e.d.dest.y);
		
		return e;
	};
	
	ParticleField.prototype.inject =
		function(r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay) {
		if(a == 0) return;
		
		var i = -1;
		if(this._osp >= 0) {
			i = this._openSlots[this._osp--];
		}else{
			i = this._highest + 11;
			this._highest = i;
		}
		
		// Drop pixels we can't add
		if(i >= this._field.length) return;
		
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
	}
	
	ParticleField.prototype.createField = function(pixels) {
		this._field = new Uint16Array(pixels * 11);
		this._highest = 0;
		this._pixels = pixels * 11;
		if(this._field.length >= (1 << 16)) {
			this._openSlots = new Uint32Array(pixels);
		}else{
			this._openSlots = new Uint16Array(pixels);
		}
		this._osp = -1;
	};
	
	ParticleField.prototype.deRange = function(val, def) {
		if(Array.isArray(val)) {
			return (this.random(val[0], val[1]));
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
	
	ParticleField.prototype.random = function(min, max) {
		this._rand ^= this._rand << 27;
		this._rand ^= this._rand >>> 25;
		this._rand ^= this._rand << 12;
		return ~~Math.abs(this._rand % (max - min) + min);
	};
	
	ParticleField.prototype.loadBM = function(data) {};
	ParticleField.prototype.saveBM = function() {return {}};
	
	sgui.registerType("ParticleField", ParticleField);
	
	return ParticleField;
})());
