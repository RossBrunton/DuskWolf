//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("test");
dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("test.dusk.EventDispatcher");

test.registerTestFunction(function(window) {
	test.package = "test.dusk.EventDispatcher";
	
	test.start("Construction");
	
	var none = new dusk.EventDispatcher("test.none");
	test.assertEqual(none.mode, dusk.EventDispatcher.MODE_NONE);
	none = new dusk.EventDispatcher("test.none", dusk.EventDispatcher.MODE_NONE);
	var and = new dusk.EventDispatcher("test.and", dusk.EventDispatcher.MODE_AND);
	var or = new dusk.EventDispatcher("test.or", dusk.EventDispatcher.MODE_OR);
	var pass = new dusk.EventDispatcher("test.pass", dusk.EventDispatcher.MODE_PASS);
	var last = new dusk.EventDispatcher("test.last", dusk.EventDispatcher.MODE_LAST);
});
