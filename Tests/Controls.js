//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.Controls", (function() {
	var test = dusk.load.require("test");
	var controls = dusk.load.require("dusk.controls");
	
	test.registerTestFunction(function(window) {
		test.package = "test.dusk.Controls";
		
		test.start("Registering New Control");
		
		controls.addControl("none");
		test.assertEqual(controls.lookupControl("none"), [null, null]);
		
		controls.addControl("keya", 65);
		test.assertEqual(controls.lookupControl("keya"), [65, null]);
		
		controls.addControl("button1", undefined, 1);
		test.assertEqual(controls.lookupControl("button1"), [null, 1]);
		
		controls.addControl("axis2", undefined, "2+0.5");
		test.assertEqual(controls.lookupControl("axis2"), [null, "2+0.5"]);
		
		controls.addControl("both", 65, 1);
		test.assertEqual(controls.lookupControl("both"), [65, 1]);
		
		
		test.start("Changing Mappings");
		
		controls.mapKey("keya", 67);
		test.assertEqual(controls.lookupControl("keya"), [67, null]);
		controls.mapKey("keya", 65);
		
		controls.mapButton("button1", 2);
		test.assertEqual(controls.lookupControl("button1"), [null, 2]);
		controls.mapButton("button1", 1);
		
		// Control doesn't exist; you need to add them before changing mappings
		controls.mapKey("dne", 69);
		controls.mapButton("dne", 3);
		test.assertNotExists(controls.lookupControl("dne"));
		
		
		test.start("Checking Controls");
		
		test.assertTrue(controls.checkKey("keya", 65));
		test.assertTrue(controls.checkButton("button1", 1));
		
		test.assertTrue(controls.check("keya", 65));
		test.assertTrue(controls.check("button1", null, 1));
		test.assertTrue(controls.check("button1", undefined, 1));
		
		test.assertFalse(controls.checkKey("keya", 67));
		test.assertFalse(controls.checkButton("button1", 2));
		
		test.assertFalse(controls.check("keya", 67));
		test.assertFalse(controls.check("button1", null, 2));
		test.assertFalse(controls.check("button1", undefined, 2));
		
		test.assertFalse(controls.check("dne", 69, 2));
	});
})());
