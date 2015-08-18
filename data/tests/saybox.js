//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("tests.saybox", (function() {
	var sgui = load.require("dusk.sgui");
	var PlusText = load.require("dusk.sgui.PlusText");
	var Group = load.require("dusk.sgui.Group");
	var Rect = load.require("dusk.sgui.Rect");
	var SayBox = load.require("dusk.sgui.SayBox");
	var dusk = load.require("dusk");
	var Runner = load.require("dusk.script.Runner");
	
	sgui.get("default", true).update({
		allowMouse:true,
		children:{
			say:{
				type:"SayBox",
				mark:"#ff0000",
				yOrigin:"bottom",
				y:-10,
				xDisplay:"expand",
				children:{
					left:{
						plus:{
							colour:"#ffff99",
						},
						plusType:"Rect",
					},
					right:{
						plus:{
							colour:"#ff99ff",
						},
						plusType:"Rect",
					},
					body:{
						plus:{
							colour:"#99ffff",
						},
						plusType:"Rect",
					}
				}
			}
		}
	});
	
	window.saybox = sgui.path("default:/say");
	
	(new Runner([
		saybox.runnerSayAction("Steve", "Hello!"),
		saybox.runnerSayAction("Barry", "Oh, hello there Steve!"),
		function(x) {
			x.context = {num:~~(Math.random()*10000)};
			
			return x;
		},
		saybox.runnerSayAction("Steve", "My favorite number is {{ num }}, {{ num }} I say!", "", "context"),
		saybox.runnerSayAction
			("Barry", "Meh, I like [b]bold[/b] or [u]underlined[/u] text.\nOh! And newlines!", "", "context"),
		saybox.runnerSayAction("Steve", "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumyeirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diamvoluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumyeirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diamvoluptua. At vero eos et accusam et justo duo dolores et ea reb"),
	])).start({}).then(console.log.bind(console), console.warn.bind(console));
	
	dusk.startGame();
})());
