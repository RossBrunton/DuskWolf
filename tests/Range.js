//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.Range", (function() {
	var test = load.require("test");
	var Range = load.require("dusk.Range");
	
	test.registerTestFunction("test.dusk.Range", function(tester) {
		tester.start("Construction");
		
		var ten = new Range(0, 10, 5, 1, 1);
		tester.assertEqual(ten.min, 0);
		tester.assertEqual(ten.max, 10);
		tester.assertEqual(ten.value, 5);
		tester.assertEqual(ten.stepUp, 1);
		tester.assertEqual(ten.stepDown, 1);
		
		var def = new Range();
		tester.assertEqual(def.min, 0);
		tester.assertEqual(def.max, 100);
		tester.assertEqual(def.value, 50);
		tester.assertEqual(def.stepUp, 1);
		tester.assertEqual(def.stepDown, 1);
		
		var twos = new Range(25, 50, 25, 2, 2);
		tester.assertEqual(twos.min, 25);
		tester.assertEqual(twos.max, 50);
		tester.assertEqual(twos.value, 25);
		tester.assertEqual(twos.stepUp, 2);
		tester.assertEqual(twos.stepDown, 2);
		
		
		tester.start("Assign value");
		ten.value = 7;
		tester.assertEqual(ten.value, 7);
		ten.value = 7.5;
		tester.assertEqual(ten.value, 7.5);
		ten.value = 11;
		tester.assertEqual(ten.value, 10);
		ten.value = -1;
		tester.assertEqual(ten.value, 0);
		ten.value = 5;
		tester.assertEqual(ten.value, 5);
		
		
		tester.start("Stepping");
		ten.up();
		tester.assertEqual(ten.value, 6);
		ten.down();
		tester.assertEqual(ten.value, 5);
		ten.value = 0;
		ten.down();
		tester.assertEqual(ten.value, 0);
		ten.value = 10;
		ten.up();
		tester.assertEqual(ten.value, 10);
		
		twos.up();
		tester.assertEqual(twos.value, 27);
		twos.down();
		tester.assertEqual(twos.value, 25);
		
		
		tester.start("Fractional Steps");
		
		ten.value = 5;
		ten.setUpFraction(0.1);
		tester.assertEqual(ten.stepUp, 1);
		ten.setUpFraction(0.5);
		tester.assertEqual(ten.stepUp, 5);
		ten.setDownFraction(0.1);
		tester.assertEqual(ten.stepDown, 1);
		ten.setDownFraction(0.5);
		tester.assertEqual(ten.stepDown, 5);
		
		
		tester.start("Getting Fraction");
		
		ten.value = 5;
		tester.assertEqual(ten.getFraction(), 0.5);
		ten.value = 7;
		tester.assertEqual(ten.getFraction(), 0.7);
		ten.value = 0;
		tester.assertEqual(ten.getFraction(), 0.0);
		ten.value = 10;
		tester.assertEqual(ten.getFraction(), 1.0);
	});
})());
