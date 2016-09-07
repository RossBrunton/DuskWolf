//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.label", function() {
	var sgui = load.require("dusk.sgui");
	var PlusText = load.require("dusk.sgui.PlusText");
	var TextBox = load.require("dusk.sgui.TextBox");
	var Group = load.require("dusk.sgui.Group");
	var Rect = load.require("dusk.sgui.Rect");
	var Label = load.require("dusk.sgui.Label");
	var ValidatingLabel = load.require("dusk.text.sgui.ValidatingLabel");
	var dusk = load.require("dusk");
	var Runner = load.require("dusk.script.Runner");
	
	sgui.get("default", true).update({
		allowMouse:true,
		focus:"tb",
		active:true,
		children:{
			a:{
				type:"Label",
				x:10,
				y:0,
				text:"Test text... [b]Bold[/b] [i]Italic[/i] [u]Underline[/u] [colour red]Colour[/colour]\
					[font serif]Font[/font] [bsize 2][bcolour #ff0000]Border[/bcolour][/bsize] Final\
					[img smile.png]Not found[/img] More text"
			},
			b:{
				type:"Label",
				x:10,
				y:30,
				multiline:true,
				borderSize:5,
				borderColour:"#999999",
				width:200,
				text:"Test Multiline...\n[b]Bold[/b]\n[i]Italic[/i]\n[u]Underline[/u]\n[font serif]Font[/font]\
					\n\n[bsize 2][bcolour #ff0000]Border[/bcolour][/bsize]\n[bsize 0]No Border[/bsize]\
					\n\nTwo newlines\n\n\nThree newlines\n\
					[img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img][img smile.png]Not found[/img]"
			},
			d:{
				type:"Label",
				x:500,
				y:30,
				multiline:true,
				width:200,
				text:"Underline [u]test!\na\naaa\naaaaaaa\naaaaaaaaaaaaaa\n[colour #ff0000]aaaaaa[/colour]\naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naa\naaa[/u] is over.",
			},
			
			tb:{
				type:"TextBox",
				x:10,
				y:300,
				text:"TAXT",
				downFlow:"tb2",
			},
			
			tb2:{
				type:"TextBox",
				x:10,
				y:350,
				text:"TAXT",
				upFlow:"tb"
			},
			
			c:{
				type:"Label",
				x:220,
				y:30,
				width:200,
				text:"Test width... [b]Bold[/b] [i]Italic[/i] [u]Underline[/u] [font serif]Font[/font]\
					[bsize 2][bcolour #ff0000]Border[/bcolour][/bsize]"
			},
			
			v:{
				type:"ValidatingLabel",
				x:450,
				y:30,
				text:"Validating Label",
				validFilter:ValidatingLabel.VALID_NUMBER,
				validCancel:true,
				validDefault:"0"
			},
			
			dg:{
				type:"Group",
				width:200,
				x:220,
				y:50,
				children:{
					d:{
						type:"Label",
						xDisplay:"expand",
						multiline:true,
						text:"Multiline text in a expand box thing!\nLorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumyeirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diamvoluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumyeirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diamvoluptua. At vero eos et accusam et justo duo dolores et ea reb"
					},
				},
			},
		}
	});
	
	window.dg = sgui.path("default:/dg");
	window.v = sgui.path("default:/v");
	
	dusk.startGame();
});
