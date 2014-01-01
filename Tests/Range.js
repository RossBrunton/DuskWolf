//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("test");
dusk.load.require("dusk.Range");

dusk.load.provide("test.dusk.Range");

(function(window) {
	test.package = "test.dusk.Range";
	
	test.start("Construction");
	
	var ten = new dusk.Range(0, 10, 5, 1, 1);
	test.assertEqual(ten.min, 0);
	test.assertEqual(ten.max, 10);
	test.assertEqual(ten.value, 5);
	test.assertEqual(ten.stepUp, 1);
	test.assertEqual(ten.stepDown, 1);
	
	var def = new dusk.Range();
	test.assertEqual(def.min, 0);
	test.assertEqual(def.max, 100);
	test.assertEqual(def.value, 50);
	test.assertEqual(def.stepUp, 1);
	test.assertEqual(def.stepDown, 1);
	
	var twos = new dusk.Range(25, 50, 25, 2, 2);
	test.assertEqual(twos.min, 25);
	test.assertEqual(twos.max, 50);
	test.assertEqual(twos.value, 25);
	test.assertEqual(twos.stepUp, 2);
	test.assertEqual(twos.stepDown, 2);
	
	
	test.start("Assign value");
	ten.value = 7;
	test.assertEqual(ten.value, 7);
	ten.value = 7.5;
	test.assertEqual(ten.value, 7.5);
	ten.value = 11;
	test.assertEqual(ten.value, 10);
	ten.value = -1;
	test.assertEqual(ten.value, 0);
	ten.value = 5;
	test.assertEqual(ten.value, 5);
	
	
	test.start("Stepping");
	ten.up();
	test.assertEqual(ten.value, 6);
	ten.down();
	test.assertEqual(ten.value, 5);
	ten.value = 0;
	ten.down();
	test.assertEqual(ten.value, 0);
	ten.value = 10;
	ten.up();
	test.assertEqual(ten.value, 10);
	
	twos.up();
	test.assertEqual(twos.value, 27);
	twos.down();
	test.assertEqual(twos.value, 25);
	
	
	test.start("Fractional Steps");
	
	ten.value = 5;
	ten.setUpFraction(0.1);
	test.assertEqual(ten.stepUp, 1);
	ten.setUpFraction(0.5);
	test.assertEqual(ten.stepUp, 5);
	ten.setDownFraction(0.1);
	test.assertEqual(ten.stepDown, 1);
	ten.setDownFraction(0.5);
	test.assertEqual(ten.stepDown, 5);
	
	
	test.start("Getting Fraction");
	
	ten.value = 5;
	test.assertEqual(ten.getFraction(), 0.5);
	ten.value = 7;
	test.assertEqual(ten.getFraction(), 0.7);
	ten.value = 0;
	test.assertEqual(ten.getFraction(), 0.0);
	ten.value = 10;
	test.assertEqual(ten.getFraction(), 1.0);
	
})(window);
