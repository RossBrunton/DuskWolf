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
	});
})());
