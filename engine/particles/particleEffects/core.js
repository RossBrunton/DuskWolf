//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";


load.provide("dusk.particles.particleEffects.core", (function() {
	var Image = load.require("dusk.utils.Image");
	var utils = load.require("dusk.utils");
	var PosRect = load.require("dusk.utils.PosRect");
	
	var _images = {};
	
	var _effects = {};
	
	var core = {};
	
	core.imageData = function(what, field) {
		if(typeof what == "string") {
			//if(!(what in _images)) {
				var img = (new Image(what)).asCanvas();
				
				_images[what] = img.getContext("2d").getImageData(0, 0, img.width, img.height);
				return _images[what];
			//}else{
				//return _images[what];
			//}
		}
		
		if(what) {
			var c = utils.createCanvas(what.width, what.height).getContext("2d");
			
			what.paint(c);
			
			return c.getImageData(0, 0, what.width, what.height);
		}
	};

	core.applyAlteration = function(origin, obj, props, alter) {
		for(var p in props) {
			if(p in obj) {
				obj[p] = origin[p] + alter * props[p];
			}
		}
	};
	
	core.registerEffect = function(name, funct) {
		_effects[name] = funct;
	};
	
	core.getEffect = function(name) {
		return _effects[name];
	};
	
	return core;
})());


load.provide("dusk.particles.particleEffects.core.spew", (function() {
	var core = load.require("dusk.particles.particleEffects.core");
	var spew = function(field, data) {
		for(var i = 0; i < data.count; i ++) {
			field.inject(
				field.deRange(data.r, 255),
				field.deRange(data.g, 255),
				field.deRange(data.b, 255),
				field.deRange(data.a, 255),
				field.deRange(data.x, 0),
				field.deRange(data.y, 0),
				field.deRange(data.dx, [-1, 1]),
				field.deRange(data.dy, [-1, 1]),
				field.deRange(data.ddx, 0),
				field.deRange(data.ddy, 0),
				field.deRange(data.dxlimit, 0),
				field.deRange(data.dylimit, 0),
				field.deRange(data.lifespan, field.deRange([10, 20])),
				field.deRange(data.decay, 10)
			);
			//r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay
		}
	};
	
	core.registerEffect("spew", spew);
	return spew;
})());


load.provide("dusk.particles.particleEffects.core.spread", (function() {
	var core = load.require("dusk.particles.particleEffects.core");
	var spread = function(field, data) {
		for(var i = 0; i < data.count; i ++) {
			var angle = field.deRange(data.angle, [0, 2]) * Math.PI;
			var d = field.deRange(data.d, [0, 2]);
			var dd = field.deRange(data.dd, 0);
			var dlimit = field.deRange(data.dlimit, 0);
			
			field.inject(
				field.deRange(data.r, 255),
				field.deRange(data.g, 255),
				field.deRange(data.b, 255),
				field.deRange(data.a, 255),
				field.deRange(data.x, 0),
				field.deRange(data.y, 0),
				Math.cos(angle) * d + field.deRange(data.dx, 0),
				Math.sin(angle) * d + field.deRange(data.dy, 0),
				Math.cos(angle) * dd + field.deRange(data.ddx, 0),
				Math.sin(angle) * dd + field.deRange(data.ddy, 0),
				Math.cos(angle) * dlimit + field.deRange(data.dxlimit, 0),
				Math.sin(angle) * dlimit + field.deRange(data.dylimit, 0),
				field.deRange(data.lifespan, field.deRange([10, 20])),
				field.deRange(data.decay, 10)
			);
			//r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay
		}
	};
	
	core.registerEffect("spread", spread);
	return spread;
})());


load.provide("dusk.particles.particleEffects.core.image", (function() {
	var core = load.require("dusk.particles.particleEffects.core");
	var utils = load.require("dusk.utils");
	
	var image = function(field, data) {
		var id = core.imageData(data.source, field);
		var baseX = (data.x?data.x:0) - (id.width/2);
		var baseY = (data.y?data.y:0) - (id.height/2);
		
		if(!("child" in data)) data.child = {};
		if(!("count" in data.child)) data.child.count = 1;
		
		var c = utils.copy(data.child, true);
		
		for(var y = 0; y < id.height; y ++) {
			for(var x = 0; x < id.width; x ++) {
				var base = ((y * id.width) + x) * 4;
				if(id.data[base + 3] > 0 && (!("chance" in data) || Math.random() > data.chance)) {
					if("alterL" in data) core.applyAlteration(data.child, c, data.alterL, (id.width-x)/id.width);
					if("alterR" in data) core.applyAlteration(data.child, c, data.alterR, (x)/id.width);
					if("alterU" in data) core.applyAlteration(data.child, c, data.alterU, (id.height-y)/id.height);
					if("alterD" in data) core.applyAlteration(data.child, c, data.alterD, (y)/id.height);
					
					c.x = baseX + x;
					c.y = baseY + y;
					c.r = id.data[base+0];
					c.g = id.data[base+1];
					c.b = id.data[base+2];
					c.a = id.data[base+3];
					field.applyEffect(c.effect, c);
				}
			}
			//r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay
		}
	};
	
	core.registerEffect("image", image);
	return image;
})());
