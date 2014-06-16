//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.EventDispatcher", (function() {
	var test = load.require("test");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
	test.registerTestFunction(function(window) {
		test.package = "test.dusk.EventDispatcher";
		
		test.start("Construction");
		
		var none = new EventDispatcher("test.none");
		test.assertEqual(none.mode, EventDispatcher.MODE_NONE);
		
		none = new EventDispatcher("test.none", EventDispatcher.MODE_NONE);
		var and = new EventDispatcher("test.and", EventDispatcher.MODE_AND);
		var or = new EventDispatcher("test.or", EventDispatcher.MODE_OR);
		var pass = new EventDispatcher("test.pass", EventDispatcher.MODE_PASS);
		var last = new EventDispatcher("test.last", EventDispatcher.MODE_LAST);
		
		test.start("Simple Event Firing");
		
		var output = false;
		var a = none.listen(function() {output = true});
		test.assertFalse(output);
		none.fire({});
		test.assertTrue(output);
		
		output = false;
		var b = or.listen(function() {output = true});
		test.assertFalse(output);
		or.fire({});
		test.assertTrue(output);
		
		test.start("Unlistening");
		
		output = false;
		none.unlisten(a);
		none.fire();
		test.assertFalse(output);
		
		output = false;
		or.unlisten(b);
		or.fire();
		test.assertFalse(output);
		
		test.start("Event Objects");
		
		var hold = 0;
		a = none.listen(function(o) {hold = o.value});
		none.fire({"value":3});
		test.assertEqual(hold, 3);
		none.unlisten(a);
		
		hold = 0;
		b = or.listen(function(o) {hold = o.value});
		or.fire({"value":3});
		test.assertEqual(hold, 3);
		or.unlisten(b);
		
		test.start("Positive Property Filtering");
		
		hold = 0;
		a = none.listen(function(o) {hold = o.value}, undefined, {"exec":true});
		none.fire({"value":3, "exec":true});
		test.assertEqual(hold, 3);
		none.fire({"value":4, "exec":false});
		test.assertEqual(hold, 3);
		none.unlisten(a);
		
		hold = 0;
		b = or.listen(function(o) {hold = o.value}, undefined, {"exec":true});
		or.fire({"value":3, "exec":true});
		test.assertEqual(hold, 3);
		or.fire({"value":4, "exec":false});
		test.assertEqual(hold, 3);
		or.unlisten(b);
		
		test.start("Negative Property Filtering");
		
		hold = 0;
		a = none.listen(function(o) {hold = o.value}, undefined, {}, {"exec":true});
		none.fire({"value":3, "exec":false});
		test.assertEqual(hold, 3);
		none.fire({"value":4, "exec":true});
		test.assertEqual(hold, 3);
		none.unlisten(a);
		
		hold = 0;
		b = or.listen(function(o) {hold = o.value}, undefined, {}, {"exec":true});
		or.fire({"value":3, "exec":false});
		test.assertEqual(hold, 3);
		or.fire({"value":4, "exec":true});
		test.assertEqual(hold, 3);
		or.unlisten(b);
		
		test.start("Return Values");
		
		var t = function() {return true;}
		var f = function() {return false;}
		var i = function(i) {return i + 1;}
		
		a = none.listen(t);
		test.assertNotExists(none.fire());
		none.unlisten(a);
		
		a = and.listen(t);
		test.assertTrue(and.fire());
		b = and.listen(f);
		test.assertFalse(and.fire());
		and.unlisten(a);
		and.unlisten(b);
		
		a = or.listen(t);
		test.assertTrue(or.fire());
		b = or.listen(f);
		test.assertTrue(or.fire());
		or.unlisten(a);
		test.assertFalse(or.fire());
		or.unlisten(b);
		
		a = pass.listen(i);
		test.assertEqual(pass.fire(0), 1);
		b = pass.listen(i);
		test.assertEqual(pass.fire(0), 2);
		pass.unlisten(a);
		pass.unlisten(b);
		
		a = last.listen(t);
		test.assertTrue(last.fire());
		b = last.listen(f);
		test.assertFalse(last.fire());
		last.unlisten(b);
		test.assertTrue(last.fire());
		last.unlisten(a);
	});
})());
