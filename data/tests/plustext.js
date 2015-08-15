//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.plustext", (function() {
	var sgui = load.require("dusk.sgui");
	var PlusText = load.require("dusk.sgui.PlusText");
	var Group = load.require("dusk.sgui.Group");
	var Checkbox = load.require("dusk.sgui.Checkbox");
	var Grid = load.require("dusk.sgui.Grid");
	var Rect = load.require("dusk.sgui.Rect");
	var dusk = load.require("dusk");
	
	sgui.addStyle("PlusText", {mark:"#ff0000"});
	sgui.addStyle("Rect", {mark:"#00ff00"});
	sgui.addStyle("Label", {mark:"#0000ff"});
	
	sgui.get("default", true).update({
		allowMouse:true,
		children:{
			left:{
				type:"Group",
				x:10,
				y:10,
				children:{
					a:{
						type:"PlusText",
						text:"onLeft=false,behind=false",
						onLeft:false,
						behind:false,
						plusType:"Rect",
						plus:{
							width:30,
							height:30,
							colour:"#999999",
						}
					},
					
					b:{
						type:"PlusText",
						text:"onLeft=true,behind=false",
						onLeft:true,
						behind:false,
						y:30,
						plusType:"Rect",
						plus:{
							width:10,
							height:10,
							colour:"#999999",
						}
					},
					
					c:{
						type:"PlusText",
						text:"onLeft=false,behind=true",
						onLeft:false,
						behind:true,
						y:60,
						plusType:"Rect",
						plus:{
							width:10,
							height:10,
							colour:"#999999",
						}
					},
					
					d:{
						type:"PlusText",
						text:"onLeft=true,behind=true",
						onLeft:true,
						behind:true,
						y:90,
						plusType:"Rect",
						plus:{
							width:10,
							height:10,
							colour:"#999999",
						}
					}
				}
			},
			
			multiline:{
				type:"Grid",
				x:10,
				y:150,
				rows:1,
				cols:2,
				globals:{
					type:"PlusText",
					plusType:"Rect",
					text:"Multiline\nText\nBox",
					label:{
						multiline:true,
						width:50,
					},
					width:100,
				},
				populate:[
					{behind:true, plus:{xDisplay:"expand", yDisplay:"expand"}},
					{behind:false, plus:{width:30, height:30}},
				]
			},
			
			rightgrid:{
				allowMouse:true,
				type:"Grid",
				x:300,
				y:10,
				rows:5,
				cols:1,
				globals:{
					type:"PlusText",
					onLeft:true,
					behind:false,
					plusType:"Checkbox",
					width:100,
					allowMouse:true,
					plus:{
						allowMouse:true,
					}
				},
				populate:[
					{text:"Option1"},
					{text:"Option2"},
					{text:"Option3"},
					{text:"Option4"},
					{text:"Option5"},
				]
			},
			
			rightgridnp:{
				allowMouse:true,
				type:"Grid",
				x:300,
				y:200,
				rows:5,
				cols:1,
				globals:{
					type:"PlusText",
					onLeft:true,
					behind:false,
					plusType:"Checkbox",
					width:100,
					allowMouse:true,
					plusProxy:false,
					plus:{
						allowMouse:true,
					}
				},
				populate:[
					{text:"Option1"},
					{text:"Option2"},
					{text:"Option3"},
					{text:"Option4"},
					{text:"Option5"},
				]
			},
			
			expandrects:{
				allowMouse:true,
				type:"Grid",
				x:450,
				y:10,
				rows:6,
				cols:1,
				globals:{
					type:"PlusText",
					behind:true,
					plusType:"Rect",
					plusProxy:false,
					plus:{
						xDisplay:"expand",
						yDisplay:"expand",
					}
				},
				populate:[
					{text:"MMM"},
					{text:"MMMMMM", label:{height:20}},
					{text:"MMMMMMMMM", label:{height:25}},
					{text:"MMMMMMMMMMMM", label:{height:30}},
					{text:"MMMMMMMMMMMMMMM", label:{height:35}},
					{text:"MMMMMMMMMMMMMMMMMM", label:{height:40}},
				]
			}
		}
	});
	
	dusk.startGame();
})());
