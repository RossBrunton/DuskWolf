//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.sgui.FluidLayer", function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var controls = load.require("dusk.input.controls");
	var editor = load.require("dusk.rooms.editor");
	
	/*
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Component
	 * @extends dusk.rooms.sgui.ILayeredRoomLayer
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	class FluidLayer extends Component {
		constructor(parent, name) {
			super(parent, name);
			
			this.level = -1;
			this.colour = "#6699ff";
			this.alpha = 0.5;
			this.fluidType = "water";
			
			// Listeners
			this.onPaint.listen(this._flDraw.bind(this));
			
			this.onControl.listen((function(e) {
				if(!editor.active) return;
				this.level = +prompt("Enter new fluid level (-1 for none)", this.level);
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
		}
		
		_flDraw(e) {
			if(this.level < 0) return;
			
			e.c.fillStyle = this.colour;
			
			var fluidY = this.start();
			
			if((fluidY - e.d.slice.y) > e.d.dest.height) return;
			
			e.c.fillRect(e.d.dest.x, e.d.dest.y + (fluidY - e.d.slice.y), e.d.dest.width,
				e.d.dest.height - (fluidY - e.d.slice.y)
			);
		}
		
		start() {
			if(this.level < 0) return -1;
			return this.height - this.level;
		}
		
		loadBM(data, spawn) {
			this.level = data.level;
			this.colour = data.colour;
			this.alpha = data.alpha;
			this.fluidType = data.type;
		}
	}
	
	sgui.registerType("FluidLayer", FluidLayer);
	
	return FluidLayer;
});
