//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("test");
dusk.load.require("dusk.controls");

dusk.load.provide("test.dusk.Controls");

test.registerTestFunction(function(window) {
	test.package = "test.dusk.Controls";
	
	test.start("Registering New Control");
	
	dusk.controls.addControl("none");
	test.assertEqual(dusk.controls.lookupControl("none"), [null, null]);
	
	dusk.controls.addControl("keya", 65);
	test.assertEqual(dusk.controls.lookupControl("keya"), [65, null]);
	
	dusk.controls.addControl("button1", undefined, 1);
	test.assertEqual(dusk.controls.lookupControl("button1"), [null, 1]);
	
	dusk.controls.addControl("axis2", undefined, "2+0.5");
	test.assertEqual(dusk.controls.lookupControl("axis2"), [null, "2+0.5"]);
	
	dusk.controls.addControl("both", 65, 1);
	test.assertEqual(dusk.controls.lookupControl("both"), [65, 1]);
	
	
	test.start("Changing Mappings");
	
	dusk.controls.mapKey("keya", 67);
	test.assertEqual(dusk.controls.lookupControl("keya"), [67, null]);
	dusk.controls.mapKey("keya", 65);
	
	dusk.controls.mapButton("button1", 2);
	test.assertEqual(dusk.controls.lookupControl("button1"), [null, 2]);
	dusk.controls.mapButton("button1", 1);
	
	// Control doesn't exist; you need to add them before changing mappings
	dusk.controls.mapKey("dne", 69);
	dusk.controls.mapButton("dne", 3);
	test.assertNotExists(dusk.controls.lookupControl("dne"));
	
	
	test.start("Checking Controls");
	
	test.assertTrue(dusk.controls.checkKey("keya", 65));
	test.assertTrue(dusk.controls.checkButton("button1", 1));
	
	test.assertTrue(dusk.controls.check("keya", 65));
	test.assertTrue(dusk.controls.check("button1", null, 1));
	test.assertTrue(dusk.controls.check("button1", undefined, 1));
	
	test.assertFalse(dusk.controls.checkKey("keya", 67));
	test.assertFalse(dusk.controls.checkButton("button1", 2));
	
	test.assertFalse(dusk.controls.check("keya", 67));
	test.assertFalse(dusk.controls.check("button1", null, 2));
	test.assertFalse(dusk.controls.check("button1", undefined, 2));
	
	test.assertFalse(dusk.controls.check("dne", 69, 2));
});
