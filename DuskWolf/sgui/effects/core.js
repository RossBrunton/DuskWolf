//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.ParticleField");
dusk.load.require("dusk.data");

dusk.load.provide("dusk.sgui.effects.spread");
dusk.load.provide("dusk.sgui.effects.spew");
dusk.load.provide("dusk.sgui.effects.core");

dusk.sgui.effects.core._images = {};

dusk.sgui.effects.core.imageData = function(what, field) {
	if(typeof what == "string") {
		if(what.charAt(0) == "I") {
			if(!(what.substr(1) in dusk.sgui.effects.core._images)) {
				var img = dusk.data.grabImage(what.substr(1));
				
				var c = dusk.utils.createCanvas(img.width, img.height).getContext("2d");
				c.drawImage(what, 0, 0, img.width, img.height);
				dusk.sgui.effects.core._images[what.substr(1)] = c.getImageData(0, 0, what.width, what.height);
				return dusk.sgui.effects.core._images[what.substr(1)];
			}else{
				return dusk.sgui.effects.core._images[what.substr(1)];
			}
		}
		
		if(what.charAt(0) == "C") {
			what = field.path(what.substr(1));
		}
	}
	
	if(what) {
		var c = dusk.utils.createCanvas(what.width, what.height).getContext("2d");
		what.draw(
			{"alpha":1, "sourceX":0, "sourceY":0, "destX":0, "destY":0, "width":what.width, "height":what.height}
		, c);
		return c.getImageData(0, 0, what.width, what.height);
	}
};

dusk.sgui.effects.core.applyAlteration = function(obj, props, alter) {
	for(var p in props) {
		if(p in obj) {
			obj[p] += alter * props[p];
		}
	}
};

dusk.sgui.effects.spew = function(field, data) {
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

dusk.sgui.effects.spread = function(field, data) {
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

dusk.sgui.effects.image = function(field, data) {
	var id = dusk.sgui.effects.core.imageData(data.source, field);
	var baseX = (data.x?data.x:0) - (id.width/2);
	var baseY = (data.y?data.y:0) - (id.height/2);
	if(!("count" in data)) data.count = 1;
	
	for(var y = 0; y < id.height; y ++) {
		for(var x = 0; x < id.width; x ++) {
			var base = ((y * id.width) + x) * 4;
			if(id.data[base + 3] > 0 && (!("chance" in data) || Math.random() > data.chance)) {
				var d = dusk.utils.clone(data);
				
				if("alterL" in d) dusk.sgui.effects.core.applyAlteration(d, d.alterL, (id.width-x)/id.width);
				if("alterR" in d) dusk.sgui.effects.core.applyAlteration(d, d.alterR, (x)/id.width);
				if("alterU" in d) dusk.sgui.effects.core.applyAlteration(d, d.alterU, (id.height-y)/id.height);
				if("alterD" in d) dusk.sgui.effects.core.applyAlteration(d, d.alterD, (y)/id.height);
				
				d.x = baseX + x;
				d.y = baseY + y;
				d.r = id.data[base+0];
				d.g = id.data[base+1];
				d.b = id.data[base+2];
				d.a = id.data[base+3];
				field.applyEffect(d.effect, d);
			}
		}
		//r, g, b, a, x, y, dx, dy, ddx, ddy, dxlimit, dylimit, lifespan, decay
	}
};
