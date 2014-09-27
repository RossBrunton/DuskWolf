//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.Inherit", (function() {
	var test = load.require("test");
	var InheritableContainer = load.require("dusk.utils.InheritableContainer");
	var Inheritable = load.require("dusk.utils.Inheritable");
	var utils = load.require("dusk.utils");
	
	test.registerTestFunction("test.dusk.Inherit", function(tester) {
		var cont = new InheritableContainer("Test Container");
		
		tester.start("Creating types");
		
		tester.assertNotExists(cont.getRaw("parent"));
		cont.createNewType("parent", {"a":1, "b":2, "c":3});
		tester.assertExists(cont.getRaw("parent"));
		
		tester.assertNotExists(cont.getRaw("child"));
		cont.createNewType("child", {"c":10, "d":11, "e":12}, "parent");
		tester.assertExists(cont.getRaw("child"));
		
		tester.start("Property lookup");
		
		tester.assertEqual(cont.get("parent", "a"), 1);
		tester.assertEqual(cont.get("child", "e"), 12);
		tester.assertEqual(cont.get("child", "c"), 10);
		tester.assertEqual(cont.get("parent", "c"), 3);
		tester.assertNotExists(cont.get("child", "noSuchProperty"));
		
		tester.start("Property setting");
		
		cont.set("parent", "na", 90);
		cont.set("child", "nb", 91);
		cont.set("parent", "a", 100);
		
		tester.assertEqual(cont.get("parent", "na"), 90);
		tester.assertEqual(cont.get("child", "na"), 90);
		tester.assertNotExists(cont.get("parent", "nb"));
		tester.assertEqual(cont.get("child", "nb"), 91);
		tester.assertEqual(cont.get("parent", "a"), 100);
		tester.assertEqual(cont.get("child", "a"), 100);
		
		tester.start("Get Properties As Objects");
		
		tester.assertEqual(cont.getAll("parent"), {"a":100, "b":2, "c":3, "na":90});
		tester.assertEqual(cont.getAll("child"), {"a":100, "b":2, "c":10, "d":11, "e":12, "na":90, "nb":91});
		tester.assertEqual(cont.getRaw("parent"), {"a":100, "b":2, "c":3, "na":90});
		tester.assertEqual(cont.getRaw("child"), {"c":10, "d":11, "e":12, "nb":91});
		
		tester.start("General Functions");
		
		tester.assertTrue(cont.isValidType("root"));
		tester.assertTrue(cont.isValidType("parent"));
		tester.assertTrue(cont.isValidType("child"));
		tester.assertFalse(cont.isValidType("noSuchType"));
		
		tester.assertEqual(cont.getExtendee("parent"), "root");
		tester.assertEqual(cont.getExtendee("child"), "parent");
		tester.assertEqual(cont.getExtendee("noSuchType"), "");
		
		tester.assertEqual(utils.arrayIntersect(cont.getAllNames(), ["root", "child", "parent"]).length, 3);
		tester.assertEqual(InheritableContainer.getContainer("Test Container"), cont);
		
		tester.start("Creating Inheritables");
		
		var child = cont.create("child");
		tester.assertExists(child);
		var parent = cont.create("parent");
		tester.assertExists(parent);
		var childExtra = cont.create("child", {"b":30, "d":40, "x":666});
		tester.assertExists(childExtra);
		var root = cont.create("root");
		tester.assertExists(root);
		
		tester.assertEqual(child.type, "child");
		tester.assertEqual(parent.type, "parent");
		tester.assertEqual(root.type, "root");
		tester.assertEqual(child.container, cont);
		
		tester.start("Inheritable Properties");
		
		tester.assertEqual(child.get("c"), 10);
		tester.assertEqual(parent.get("a"), 100);
		tester.assertEqual(childExtra.get("x"), 666);
		tester.assertEqual(childExtra.get("b"), 30);
		tester.assertEqual(child.get("b"), 2);
		
		tester.start("Inheritable Set Data");
		
		parent.set("c", 15);
		tester.assertEqual(parent.get("c"), 15);
		parent.set("xa", 167);
		tester.assertEqual(parent.get("xa"), 167);
		
		tester.start("Inheritable Get Unique");
		
		tester.assertEqual(root.getUnique(), {});
		tester.assertEqual(parent.getUnique(), {"c":15, "xa":167});
		tester.assertEqual(childExtra.getUnique(), {"x":666, "b":30, "d":40});
		
		tester.start("Inheritable Copy");
		
		var extraCopy = childExtra.copy();
		extraCopy.set("d", "forty");
		tester.assertEqual(extraCopy.type, "child");
		tester.assertEqual(extraCopy.container, cont);
		tester.assertEqual(extraCopy.get("d"), "forty");
		tester.assertEqual(extraCopy.get("a"), 100);
		tester.assertEqual(childExtra.get("d"), 40);
	});
})());
