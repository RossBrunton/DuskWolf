//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.EventDispatcher", (function() {
	var test = load.require("test");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
	test.registerTestFunction("test.dusk.EventDispatcher", function(tester) {
		tester.start("Construction");
		
		var none = new EventDispatcher("tester.none");
		tester.assertEqual(none.mode, EventDispatcher.MODE_NONE);
		
		none = new EventDispatcher("tester.none", EventDispatcher.MODE_NONE);
		var and = new EventDispatcher("tester.and", EventDispatcher.MODE_AND);
		var or = new EventDispatcher("tester.or", EventDispatcher.MODE_OR);
		var pass = new EventDispatcher("tester.pass", EventDispatcher.MODE_PASS);
		var last = new EventDispatcher("tester.last", EventDispatcher.MODE_LAST);
		
		tester.start("Simple Event Firing");
		
		var output = false;
		var a = none.listen(function() {output = true});
		tester.assertFalse(output);
		none.fire({});
		tester.assertTrue(output);
		
		output = false;
		var b = or.listen(function() {output = true});
		tester.assertFalse(output);
		or.fire({});
		tester.assertTrue(output);
		
		tester.start("Unlistening");
		
		output = false;
		none.unlisten(a);
		none.fire();
		tester.assertFalse(output);
		
		output = false;
		or.unlisten(b);
		or.fire();
		tester.assertFalse(output);
		
		tester.start("Event Objects");
		
		var hold = 0;
		a = none.listen(function(o) {hold = o.value});
		none.fire({"value":3});
		tester.assertEqual(hold, 3);
		none.unlisten(a);
		
		hold = 0;
		b = or.listen(function(o) {hold = o.value});
		or.fire({"value":3});
		tester.assertEqual(hold, 3);
		or.unlisten(b);
		
		tester.start("Positive Property Filtering");
		
		hold = 0;
		a = none.listen(function(o) {hold = o.value}, undefined, {"exec":true});
		none.fire({"value":3, "exec":true});
		tester.assertEqual(hold, 3);
		none.fire({"value":4, "exec":false});
		tester.assertEqual(hold, 3);
		none.unlisten(a);
		
		hold = 0;
		b = or.listen(function(o) {hold = o.value}, undefined, {"exec":true});
		or.fire({"value":3, "exec":true});
		tester.assertEqual(hold, 3);
		or.fire({"value":4, "exec":false});
		tester.assertEqual(hold, 3);
		or.unlisten(b);
		
		tester.start("Negative Property Filtering");
		
		hold = 0;
		a = none.listen(function(o) {hold = o.value}, undefined, {}, {"exec":true});
		none.fire({"value":3, "exec":false});
		tester.assertEqual(hold, 3);
		none.fire({"value":4, "exec":true});
		tester.assertEqual(hold, 3);
		none.unlisten(a);
		
		hold = 0;
		b = or.listen(function(o) {hold = o.value}, undefined, {}, {"exec":true});
		or.fire({"value":3, "exec":false});
		tester.assertEqual(hold, 3);
		or.fire({"value":4, "exec":true});
		tester.assertEqual(hold, 3);
		or.unlisten(b);
		
		tester.start("Return Values");
		
		var t = function() {return true;}
		var f = function() {return false;}
		var i = function(i) {return i + 1;}
		
		a = none.listen(t);
		tester.assertNotExists(none.fire());
		none.unlisten(a);
		
		a = and.listen(t);
		tester.assertTrue(and.fire());
		b = and.listen(f);
		tester.assertFalse(and.fire());
		and.unlisten(a);
		and.unlisten(b);
		
		a = or.listen(t);
		tester.assertTrue(or.fire());
		b = or.listen(f);
		tester.assertTrue(or.fire());
		or.unlisten(a);
		tester.assertFalse(or.fire());
		or.unlisten(b);
		
		a = pass.listen(i);
		tester.assertEqual(pass.fire(0), 1);
		b = pass.listen(i);
		tester.assertEqual(pass.fire(0), 2);
		pass.unlisten(a);
		pass.unlisten(b);
		
		a = last.listen(t);
		tester.assertTrue(last.fire());
		b = last.listen(f);
		tester.assertFalse(last.fire());
		last.unlisten(b);
		tester.assertTrue(last.fire());
		last.unlisten(a);
	});
})());
