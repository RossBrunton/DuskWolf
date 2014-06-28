//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.Pool", (function() {
	var test = load.require("test");
	var Pool = load.require("dusk.Pool");
	
	test.registerTestFunction("test.dusk.Pool", function(tester) {
		tester.start("Basic Functionality");
		
		var p = new Pool(Object);
		var o = p.alloc();
		tester.assertExists(o);
		p.free(o);
		o = p.alloc();
		o = p.alloc();
		tester.assertExists(o);
		p.free(o);
		
		tester.start("OnAlloc and onFree Functions");
		
		var alloc = false;
		var free = false;
		p = new Pool(Object, function(o) {alloc = true; return o;}, function(o) {free = true});
		tester.assertFalse(alloc || free);
		o = p.alloc();
		tester.assertTrue(alloc && !free);
		p.free(o);
		tester.assertTrue(free);
		
		tester.start("OnAlloc with Arguments");
		
		var value = 0;
		p = new Pool(Object, function(o, i) {value = i; return o});
		o = p.alloc(7);
		tester.assertEqual(value, 7);
		p.free(o);
		
		tester.start("Advanced Constructors");
		
		var con = function() {}
		con.prototype.value = 9;
		
		p = new Pool(con);
		o = p.alloc();
		tester.assertEqual(o.value, 9);
		p.free(o);
	});
})());
