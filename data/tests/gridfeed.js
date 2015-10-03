//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.gridfeed", (function() {
	var sgui = load.require("dusk.sgui");
	var PlusText = load.require("dusk.sgui.PlusText");
	var Checkbox = load.require("dusk.sgui.Checkbox");
	var TextBox = load.require("dusk.sgui.TextBox");
	var Group = load.require("dusk.sgui.Group");
	var Rect = load.require("dusk.sgui.Rect");
	var Label = load.require("dusk.sgui.Label");
	var Feed = load.require("dusk.sgui.Feed");
	var dusk = load.require("dusk");
	var Runner = load.require("dusk.script.Runner");
	
	var coms = [1, 2, 3, 4, 5].map(function(x) {var l = new Label(); l.text = ""+x; return l;});
	
	sgui.get("default", true).update({
		allowMouse:true,
		focus:"gridh",
		active:true,
		children:{
			gridh:{
				type:"Grid",
				rows:1,
				cols:5,
				x:30,
				y:10,
				globals:{
					type:"Rect",
					width:10,
					height:10,
				},
				populate:[{colour:"#333333"}, {colour:"#cccccc"}],
			},
			
			gridv:{
				type:"Grid",
				rows:5,
				cols:1,
				x:10,
				y:30,
				globals:{
					type:"Rect",
					width:10,
					height:10,
				},
				populate:[{colour:"#333333"}, {colour:"#cccccc"}],
			},
			
			grids:{
				type:"Grid",
				rows:5,
				cols:5,
				x:30,
				y:30,
				globals:{
					type:"Rect",
					width:10,
					height:10,
				},
				populate:[{colour:"#333333"}, {colour:"#cccccc"}],
			},
			
			gridc:{
				type:"Grid",
				rows:5,
				cols:1,
				x:150,
				y:30,
				populate:coms,
			}
		}
	});
	
	window.sgui = sgui;
	
	dusk.startGame();
})());
