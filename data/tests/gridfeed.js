//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.gridfeed", function() {
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
	var Fade = load.require("dusk.sgui.extras.Fade");
	var Die = load.require("dusk.sgui.extras.Die");
	
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
			},
			
			gridexp:{
				type:"Grid",
				rows:5,
				cols:5,
				width:200,
				height:200,
				x:30,
				y:150,
				hspacing:5,
				vspacing:5,
				globals:{
					type:"Rect",
					width:10,
					height:10,
				},
				populate:[{colour:"#333333", xDisplay:"expand"}, {colour:"#cccccc", yDisplay:"expand"}],
			},
			
			gridvvary:{
				type:"Grid",
				rows:5,
				cols:1,
				x:250,
				y:30,
				varyHeight:true,
				globals:{
					type:"Rect",
					width:10,
				},
				populate:[
					{colour:"#333333", height:10}, {colour:"#cccccc", height:20},
					{colour:"#333333", height:30}, {colour:"#cccccc", height:40},
					{colour:"#333333", height:50}
				],
			},
			
			gridhvary:{
				type:"Grid",
				rows:1,
				cols:5,
				x:260,
				y:20,
				varyWidth:true,
				globals:{
					type:"Rect",
					height:10,
				},
				populate:[
					{colour:"#333333", width:10}, {colour:"#cccccc", width:20},
					{colour:"#333333", width:30}, {colour:"#cccccc", width:40},
					{colour:"#333333", width:50}
				],
			},
			
			gridrvary:{
				type:"Grid",
				rows:5,
				cols:5,
				vspacing:5,
				hspacing:5,
				x:280,
				y:40,
				mark:"#ff0000",
				varyWidth:true,
				varyHeight:true,
				globals:{
					type:"Rect",
					colour:"#333333"
				},
				populate:(new Array(5*5)).fill(0).map(
					function(x) {return {width:~~(Math.random()*30)+10, height:~~(Math.random()*30)+10}}
				),
			},
			
			feed:{
				type:"Feed",
				vspacing:5,
				hspacing:5,
				x:280,
				y:250,
				mark:"#ff0000",
				varyWidth:true,
				varyHeight:true,
				globals:{
					type:"Rect",
					colour:"#333333"
				},
				populate:(new Array(5*5)).fill(0).map(
					function(x) {return {width:~~(Math.random()*30)+10, height:~~(Math.random()*30)+10}}
				),
			},
		}
	});
	
	window.sgui = sgui;
	
	window.addFeed = function() {
		sgui.path("default:/feed").append({colour:"#000000", height:~~(Math.random()*30)+10,
			width:~~(Math.random()*30)+10, extras:{
				fade:{
					type:"Fade",
					from:1.0,
					to:0.0,
					delay:~~(Math.random()*120)+10,
					duration:30,
					then:"die",
					on:true,
				},
				die:{
					type:"Die"
				}
			}
		});
	};
	
	dusk.startGame();
});
