//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.Pool", (function() {
	var test = load.require("test");
	var Pool = load.require("dusk.Pool");
	
	test.registerTestFunction(function(window) {
		test.package = "test.dusk.Pool";
		
		test.start("Basic Functionality");
		
		var p = new Pool(Object);
		var o = p.alloc();
		test.assertExists(o);
		p.free(o);
		o = p.alloc();
		o = p.alloc();
		test.assertExists(o);
		p.free(o);
		
		test.start("OnAlloc and onFree Functions");
		
		var alloc = false;
		var free = false;
		p = new Pool(Object, function(o) {alloc = true; return o;}, function(o) {free = true});
		test.assertFalse(alloc || free);
		o = p.alloc();
		test.assertTrue(alloc && !free);
		p.free(o);
		test.assertTrue(free);
		
		test.start("OnAlloc with Arguments");
		
		var value = 0;
		p = new Pool(Object, function(o, i) {value = i; return o});
		o = p.alloc(7);
		test.assertEqual(value, 7);
		p.free(o);
		
		test.start("Advanced Constructors");
		
		var con = function() {}
		con.prototype.value = 9;
		
		p = new Pool(con);
		o = p.alloc();
		test.assertEqual(o.value, 9);
		p.free(o);
	});
})());
