//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("scriptTest", (function() {
	window.Runner = load.require("dusk.script.Runner");
	window.Actions = load.require("dusk.script.Actions");
	
	window.tr1 = new Runner([
		{"forward":function(x, addActions) {return ~~(Math.random()*10);}, "inverse":function(){}},
		function(x, addActions) {
			addActions([
				function(x) {return new Promise(function(f, r) {if(x < 3) {r(new Runner.Cancel())} else {f(x)}})},
				function(x) {return new Promise(function(f, r) {if(x > 3) {r(new Runner.Cancel())} else {f(x)}})}
			]);
			return x;
		},
	]);
	
	window.trr1 = function(v) {
		tr1.start(v).then(console.log.bind(console), console.error.bind(console));
	}
	
	window.tr2 = new Runner([
		function(x) {return ~~(Math.random()*10);},
		Actions.print("Value is %"),
		Actions.if(function(x) {return x > 5}, [
			Actions.print("That is greater than 5!"),
		], [
			Actions.if(function(x) {return x == 5}, [
				Actions.print("That is equal to 5!"),
			], [
				Actions.print("That is less than 5!"),
			])
		]),
	]);
	
	window.trr2 = function(v) {
		tr2.start(v).then(console.log.bind(console), console.error.bind(console));
	}
	
	window.tr3 = new Runner([
		Actions.while(function(x) {return x != 3}, [
			function(x) {return ~~(Math.random()*10);},
			Actions.print("Lets see if % is 3..."),
		]),
	]);
	
	window.trr3 = function(v) {
		tr3.start(v).then(console.log.bind(console), console.error.bind(console));
	}
	
	return undefined;
})());
