//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.sgui.FluidLayer", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var controls = load.require("dusk.input.controls");
	var editor = load.require("dusk.rooms.editor");
	
	/*
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Component
	 * @extends dusk.rooms.sgui.ILayeredRoomLayer
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var FluidLayer = function(parent, comName) {
		Component.call(this, parent, comName);
		
		this.level = 50;
		this.colour = "#6699ff";
		this.alpha = 0.5;
		this.fluidType = "water";
		
		// Listeners
		this.prepareDraw.listen(_draw.bind(this));
		
		this.onControl.listen((function(e) {
			if(!editor.active) return;
			this.level = +prompt("Enter new fluid level", this.level);
		}).bind(this), controls.addControl("fluidlayer_level", "L"));
		this.onControl.listen((function(e) {
			if(!editor.active) return;
			this.colour = prompt("Enter new fluid colour", this.level);
		}).bind(this), controls.addControl("fluidlayer_colour", "C"));
		this.onControl.listen((function(e) {
			if(!editor.active) return;
			this.fluidType = prompt("Enter new fluid type", this.fluidType);
		}).bind(this), controls.addControl("fluidlayer_type", "T"));
		this.onControl.listen((function(e) {
			if(!editor.active) return;
			if(e.shift) {
				this.alpha -= 0.1;
				if(this.alpha < 0) this.alpha = 0;
			}else{
				this.alpha += 0.1;
				if(this.alpha > 1) this.alpha = 1;
			}
		}).bind(this), controls.addControl("fluidlayer_alpha", "A"));
	};
	FluidLayer.prototype = Object.create(Component.prototype);
	
	var _draw = function(e) {
		e.c.fillStyle = this.colour;
		
		var fluidY = this.start();
		
		if((fluidY - e.d.sourceY) > e.d.height) return;
		
		e.c.fillRect(e.d.destX, e.d.destY + (fluidY - e.d.sourceY), e.d.width, e.d.height - (fluidY - e.d.sourceY));
	};
	
	FluidLayer.prototype.start = function() {
		return this.height - this.level;
	}
	
	FluidLayer.prototype.loadBM = function(data, spawn) {
		this.level = data.level;
		this.colour = data.colour;
		this.alpha = data.alpha;
		this.fluidType = data.type;
	};
	
	FluidLayer.prototype.saveBM = function() {
		return {"level":this.level, "colour":this.colour, "alpha":this.alpha, "type":this.fluidType};
	};
	
	sgui.registerType("FluidLayer", FluidLayer);
	
	return FluidLayer;
})());
