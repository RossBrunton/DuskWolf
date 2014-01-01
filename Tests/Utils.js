//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("test");
dusk.load.require("dusk.utils");

dusk.load.provide("test.dusk.utils");

(function(window) {
	test.package = "test.dusk.utils";

	test.start("dusk.utils.clone");

	test.assertEqual(1, dusk.utils.clone(1));
	test.assertEqual({}, dusk.utils.clone({}));
	test.assertEqual([], dusk.utils.clone([]));

	test.assertEqual({"test":"test"}, dusk.utils.clone({"test":"test"}));
	test.assertEqual({"test":{}}, dusk.utils.clone({"test":{}}));
	test.assertEqual({"testA":{}, "testB":{}}, dusk.utils.clone({"testA":{}, "testB":{}}));
	test.assertEqual({"testA":{"p":1}, "testB":{}},dusk.utils.clone({"testA":{"p":1}, "testB":{}}));

	test.assertEqual([1, 2, 3], dusk.utils.clone([1, 2, 3]));
	test.assertEqual([[1], [2], [3]], dusk.utils.clone([[1], [2], [3]]));
	test.assertEqual([[[[[1]]]]], dusk.utils.clone([[[[[1]]]]]));


	test.start("dusk.utils.merge");

	test.assertEqual({}, dusk.utils.merge({}, {}));
	test.assertEqual({"a":1}, dusk.utils.merge({"a":1}, {}));
	test.assertEqual({"a":1}, dusk.utils.merge({}, {"a":1}));
	test.assertEqual({"a":2}, dusk.utils.merge({"a":1}, {"a":2}));
	test.assertEqual({"a":1, "b":2}, dusk.utils.merge({"a":1}, {"b":2}));


	test.start("dusk.utils.doesImplement");
	
	var cls = function(){};
	cls.a = function(){};
	cls.b = function(){};
	cls.c = function(){};
	
	test.assertTrue(dusk.utils.doesImplement(cls, ["a", "b"]));
	test.assertTrue(!dusk.utils.doesImplement(cls, ["a", "d"]));
	test.assertTrue(dusk.utils.doesImplement(cls, {"a":function(){}}));
	test.assertTrue(!dusk.utils.doesImplement(cls, {"d":function(){}}));
	
	
	test.start("dusk.utils.createCanvas");
	
	var can = document.createElement("canvas");
	can.width = 100;
	can.height = 100;
	
	test.assertEqual(dusk.utils.createCanvas(100, 100), can);
	test.assertNotEqual(dusk.utils.createCanvas(10, 10), can);
	
	
	test.start("dusk.utils.urlGet");
	
	window.history.replaceState({}, "", "?a=1&b=2&c=3");
	
	test.assertEqual(dusk.utils.urlGet("a"), "1");
	test.assertEqual(dusk.utils.urlGet("b"), "2");
	test.assertEqual(dusk.utils.urlGet("c"), "3");
	test.assertEqual(dusk.utils.urlGet("d"), null);
	
	
	/*test.start("dusk.utils.isJson");
	
	test.assertTrue(dusk.utils.isJson("{}"));
	test.assertTrue(dusk.utils.isJson('{"a":1}'));
	test.assertTrue(dusk.utils.isJson('{"a":1, "b":2}'));
	test.assertTrue(dusk.utils.isJson('{"a":1, "b":2, "c":[]}'));
	test.assertTrue(dusk.utils.isJson('{"a":1, "b":2, "c":[{}, {"a":2}]}'));
	
	test.assertTrue(!dusk.utils.isJson("{"));
	test.assertTrue(!dusk.utils.isJson("}"));
	test.assertTrue(!dusk.utils.isJson('{"a":1, "b":2, "c":[{}, {'));*/
	
	
	test.start("dusk.utils.jsonParse");
	
	test.assertEqual(dusk.utils.jsonParse("{}"), {});
	test.assertEqual(
		dusk.utils.jsonParse('{"a":1, "b":2, "c":[3, 4, 5]}'), {"a":1, "b":2, "c":[3, 4, 5]}
	);
	test.assertEqual(
		dusk.utils.jsonParse('{"a":1, /*"b":2,*/ "c":[3, 4, 5]}'), {"a":1, "c":[3, 4, 5]}
	);
	test.assertEqual(
		dusk.utils.jsonParse('{"a":1, "b":"a\nb\tc", "c":[3, 4, 5]}'),
		{"a":1, "b":"a b c", "c":[3, 4, 5]}
	);
	
	
	test.start("dusk.utils.verCompare");
	
	test.assertEqual(dusk.utils.verCompare("1", "1"), 0);
	test.assertEqual(dusk.utils.verCompare("2", "1"), 1);
	test.assertEqual(dusk.utils.verCompare("0", "1"), -1);
	
	test.assertEqual(dusk.utils.verCompare("1.1", "1.1"), 0);
	test.assertEqual(dusk.utils.verCompare("1.2", "1.1"), 1);
	test.assertEqual(dusk.utils.verCompare("1.0", "1.1"), -1);
	
	test.assertEqual(dusk.utils.verCompare("1", "1.1"), -1);
	test.assertEqual(dusk.utils.verCompare("1.1", "1"), 1);
	
	test.assertEqual(dusk.utils.verCompare("1alpha1", "1.1"), 0);
	test.assertEqual(dusk.utils.verCompare("1alpha2", "1.1"), 1);
	test.assertEqual(dusk.utils.verCompare("1alpha0", "1.1"), -1);
	
	test.assertEqual(dusk.utils.verCompare("11", "11"), 0);
	test.assertEqual(dusk.utils.verCompare("12", "11"), 1);
	test.assertEqual(dusk.utils.verCompare("10", "11"), -1);
	
	
	test.start("dusk.utils.resolveRelative");
	
	test.assertEqual(
		dusk.utils.resolveRelative("http://www.example.com/a", "http://www.example.com/"),
		"http://www.example.com/a"
	);
	
	test.assertEqual(
		dusk.utils.resolveRelative("/a", "http://www.example.com/"),
		"/a"
	);
	
	test.assertEqual(
		dusk.utils.resolveRelative("a", "http://www.example.com/"),
		"http://www.example.com/a"
	);
	
	test.assertEqual(
		dusk.utils.resolveRelative("a/b", "http://www.example.com/"),
		"http://www.example.com/a/b"
	);
	
	
	test.start("dusk.utils.arrayEqual");
	
	test.assertTrue(dusk.utils.arrayEqual([], []));
	test.assertFalse(dusk.utils.arrayEqual([], [1]));
	test.assertTrue(dusk.utils.arrayEqual([1, 2, 3], [1, 2, 3]));
	test.assertFalse(dusk.utils.arrayEqual([1, 2, 3], [1, 2, 5]));
	
	
	test.start("dusk.utils.arrayUnion");
	
	test.assertEqual(
		dusk.utils.arrayUnion([], []),
		[]
	);
	
	test.assertEqual(
		dusk.utils.arrayUnion([1, 2], [2]),
		[2]
	);
	
	test.assertEqual(
		dusk.utils.arrayUnion([1, 2, 3], [2, 3]).sort(function(a,b){return a-b}),
		[2, 3]
	);
	
	
	test.start("dusk.utils.dataToString and dusk.utils.stringToData");
	
	var ab = new Uint32Array(500);
	for(var i = ab.length-1; i >= 0; i --) {
		ab[i] = i;
	}
	
	test.assertTrue(
		dusk.utils.arrayEqual(
			new Uint32Array(
				dusk.utils.stringToData(dusk.utils.dataToString(ab.buffer, dusk.utils.SD_HEX))
			),
			ab
		)
	);
	
	test.assertTrue(
		dusk.utils.arrayEqual(
			new Uint32Array(
				dusk.utils.stringToData(dusk.utils.dataToString(ab.buffer, dusk.utils.SD_BC16))
			),
			ab
		)
	);
	
	var ab = new Uint32Array(500);
	for(var i = ab.length-1; i >= 0; i --) {
		ab[i] = 50;
	}
	
	test.assertTrue(
		dusk.utils.arrayEqual(
			new Uint32Array(
				dusk.utils.stringToData(dusk.utils.dataToString(ab.buffer, dusk.utils.SD_HEX))
			),
			ab
		)
	);
	
	test.assertTrue(
		dusk.utils.arrayEqual(
			new Uint32Array(
				dusk.utils.stringToData(dusk.utils.dataToString(ab.buffer, dusk.utils.SD_BC16))
			),
			ab
		)
	);
	
})(window);
