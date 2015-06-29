//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.checkbox", (function() {
	var sgui = load.require("dusk.sgui");
	var Checkbox = load.require("dusk.sgui.Checkbox");
	var Group = load.require("dusk.sgui.Group");
	var Radiobox = load.require("dusk.sgui.extras.Radiobox");
	var Grid = load.require("dusk.sgui.Grid");
	var dusk = load.require("dusk");
	
	sgui.get("default", true).update({
		allowMouse:true,
		mouseFocus:true,
		children:{
			plainGrid:{
				allowMouse:true,
				mouseFocus:true,
				type:"Grid",
				rows:10,
				cols:10,
				globals:{
					allowMouse:true,
					type:"Checkbox",
				},
				populate:{},
				rightFlow:"radioGrid",
			},
			
			radioGrid:{
				allowMouse:true,
				x:200,
				type:"Grid",
				rows:10,
				cols:10,
				globals:{
					allowMouse:true,
					type:"Checkbox",
				},
				populate:{},
				extras:{
					radio:{
						type:"Radiobox",
					},
				},
				leftFlow:"plainGrid"
			},
		},
		
		focus:"plainGrid"
	});
	
	sgui.path("default:/plainGrid").forEach(function(c) {
		c.onCheck.listen(function(e) {
			console.log("Plainbox "+e.component.name+" triggered, now state is "+e.component.checked+"="+e.checked);
		});
	});
	
	sgui.path("default:/radioGrid").forEach(function(c) {
		c.onCheck.listen(function(e) {
			console.log("Radiobox "+e.component.name+" triggered, now state is "+e.component.checked+"="+e.checked);
		});
	});
	
	dusk.startGame();
})());
