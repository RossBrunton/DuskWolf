//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("runTests", (function() {
	var test = load.require("test");
	
	test.loadAndTestAll("tests/deps.json");
})());
