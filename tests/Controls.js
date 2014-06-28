//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.Controls", (function() {
	var test = load.require("test");
	var controls = load.require("dusk.controls");
	
	test.registerTestFunction("test.dusk.Controls", function(tester) {
		tester.start("Registering New Control");
		
		controls.addControl("none");
		tester.assertEqual(controls.lookupControl("none"), [null, null]);
		
		controls.addControl("keya", 65);
		tester.assertEqual(controls.lookupControl("keya"), [65, null]);
		
		controls.addControl("button1", undefined, 1);
		tester.assertEqual(controls.lookupControl("button1"), [null, 1]);
		
		controls.addControl("axis2", undefined, "2+0.5");
		tester.assertEqual(controls.lookupControl("axis2"), [null, "2+0.5"]);
		
		controls.addControl("both", 65, 1);
		tester.assertEqual(controls.lookupControl("both"), [65, 1]);
		
		
		tester.start("Changing Mappings");
		
		controls.mapKey("keya", 67);
		tester.assertEqual(controls.lookupControl("keya"), [67, null]);
		controls.mapKey("keya", 65);
		
		controls.mapButton("button1", 2);
		tester.assertEqual(controls.lookupControl("button1"), [null, 2]);
		controls.mapButton("button1", 1);
		
		// Control doesn't exist; you need to add them before changing mappings
		controls.mapKey("dne", 69);
		controls.mapButton("dne", 3);
		tester.assertNotExists(controls.lookupControl("dne"));
		
		
		tester.start("Checking Controls");
		
		tester.assertTrue(controls.checkKey("keya", 65));
		tester.assertTrue(controls.checkButton("button1", 1));
		
		tester.assertTrue(controls.check("keya", 65));
		tester.assertTrue(controls.check("button1", null, 1));
		tester.assertTrue(controls.check("button1", undefined, 1));
		
		tester.assertFalse(controls.checkKey("keya", 67));
		tester.assertFalse(controls.checkButton("button1", 2));
		
		tester.assertFalse(controls.check("keya", 67));
		tester.assertFalse(controls.check("button1", null, 2));
		tester.assertFalse(controls.check("button1", undefined, 2));
		
		tester.assertFalse(controls.check("dne", 69, 2));
	});
})());
