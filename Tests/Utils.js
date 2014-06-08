//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.utils", (function() {
	var test = load.require("test");
	var utils = load.require("dusk.utils");
	
	test.registerTestFunction(function(window) {
		test.package = "test.dusk.utils";

		test.start("dusk.utils.clone");

		test.assertEqual(1, utils.clone(1));
		test.assertEqual({}, utils.clone({}));
		test.assertEqual([], utils.clone([]));

		test.assertEqual({"test":"test"}, utils.clone({"test":"test"}));
		test.assertEqual({"test":{}}, utils.clone({"test":{}}));
		test.assertEqual({"testA":{}, "testB":{}}, utils.clone({"testA":{}, "testB":{}}));
		test.assertEqual({"testA":{"p":1}, "testB":{}},utils.clone({"testA":{"p":1}, "testB":{}}));

		test.assertEqual([1, 2, 3], utils.clone([1, 2, 3]));
		test.assertEqual([[1], [2], [3]], utils.clone([[1], [2], [3]]));
		test.assertEqual([[[[[1]]]]], utils.clone([[[[[1]]]]]));


		test.start("dusk.utils.merge");

		test.assertEqual({}, utils.merge({}, {}));
		test.assertEqual({"a":1}, utils.merge({"a":1}, {}));
		test.assertEqual({"a":1}, utils.merge({}, {"a":1}));
		test.assertEqual({"a":2}, utils.merge({"a":1}, {"a":2}));
		test.assertEqual({"a":1, "b":2}, utils.merge({"a":1}, {"b":2}));


		test.start("dusk.utils.doesImplement");
		
		var cls = function(){};
		cls.a = function(){};
		cls.b = function(){};
		cls.c = function(){};
		
		test.assertTrue(utils.doesImplement(cls, ["a", "b"]));
		test.assertTrue(!utils.doesImplement(cls, ["a", "d"]));
		test.assertTrue(utils.doesImplement(cls, {"a":function(){}}));
		test.assertTrue(!utils.doesImplement(cls, {"d":function(){}}));
		
		
		test.start("dusk.utils.createCanvas");
		
		var can = document.createElement("canvas");
		can.width = 100;
		can.height = 100;
		
		test.assertEqual(utils.createCanvas(100, 100), can);
		test.assertNotEqual(utils.createCanvas(10, 10), can);
		
		
		test.start("dusk.utils.urlGet");
		
		test.assertEqual(utils.urlGet("a", "http://example.com/?a=1&b=2&c=3"), "1");
		test.assertEqual(utils.urlGet("b", "http://example.com/?a=1&b=2&c=3"), "2");
		test.assertEqual(utils.urlGet("c", "http://example.com/?a=1&b=2&c=3"), "3");
		test.assertEqual(utils.urlGet("d", "http://example.com/?a=1&b=2&c=3"), null);
		
		
		/*test.start("utils.isJson");
		
		test.assertTrue(utils.isJson("{}"));
		test.assertTrue(utils.isJson('{"a":1}'));
		test.assertTrue(utils.isJson('{"a":1, "b":2}'));
		test.assertTrue(utils.isJson('{"a":1, "b":2, "c":[]}'));
		test.assertTrue(utils.isJson('{"a":1, "b":2, "c":[{}, {"a":2}]}'));
		
		test.assertTrue(!utils.isJson("{"));
		test.assertTrue(!utils.isJson("}"));
		test.assertTrue(!utils.isJson('{"a":1, "b":2, "c":[{}, {'));*/
		
		
		test.start("dusk.utils.jsonParse");
		
		test.assertEqual(utils.jsonParse("{}"), {});
		test.assertEqual(
			utils.jsonParse('{"a":1, "b":2, "c":[3, 4, 5]}'), {"a":1, "b":2, "c":[3, 4, 5]}
		);
		test.assertEqual(
			utils.jsonParse('{"a":1, /*"b":2,*/ "c":[3, 4, 5]}'), {"a":1, "c":[3, 4, 5]}
		);
		test.assertEqual(
			utils.jsonParse('{"a":1, "b":"a\nb\tc", "c":[3, 4, 5]}'),
			{"a":1, "b":"a b c", "c":[3, 4, 5]}
		);
		
		
		test.start("dusk.utils.verCompare");
		
		test.assertEqual(utils.verCompare("1", "1"), 0);
		test.assertEqual(utils.verCompare("2", "1"), 1);
		test.assertEqual(utils.verCompare("0", "1"), -1);
		
		test.assertEqual(utils.verCompare("1.1", "1.1"), 0);
		test.assertEqual(utils.verCompare("1.2", "1.1"), 1);
		test.assertEqual(utils.verCompare("1.0", "1.1"), -1);
		
		test.assertEqual(utils.verCompare("1", "1.1"), -1);
		test.assertEqual(utils.verCompare("1.1", "1"), 1);
		
		test.assertEqual(utils.verCompare("1alpha1", "1.1"), 0);
		test.assertEqual(utils.verCompare("1alpha2", "1.1"), 1);
		test.assertEqual(utils.verCompare("1alpha0", "1.1"), -1);
		
		test.assertEqual(utils.verCompare("11", "11"), 0);
		test.assertEqual(utils.verCompare("12", "11"), 1);
		test.assertEqual(utils.verCompare("10", "11"), -1);
		
		
		test.start("dusk.utils.lookup");
		var a = {};
		a.b = {};
		a.b.c = {};
		
		test.assertEqual(utils.lookup(a, ""), a);
		test.assertEqual(utils.lookup(a, "b"), a.b);
		test.assertEqual(utils.lookup(a, "b.c"), a.b.c);
		
		test.assertNotExists(utils.lookup(a, "b.c.d"));
		
		
		test.start("dusk.utils.resolveRelative");
		
		test.assertEqual(
			utils.resolveRelative("http://www.example.com/a", "http://www.example.com/"),
			"http://www.example.com/a"
		);
		
		test.assertEqual(
			utils.resolveRelative("/a", "http://www.example.com/"),
			"/a"
		);
		
		test.assertEqual(
			utils.resolveRelative("a", "http://www.example.com/"),
			"http://www.example.com/a"
		);
		
		test.assertEqual(
			utils.resolveRelative("a/b", "http://www.example.com/"),
			"http://www.example.com/a/b"
		);
		
		
		test.start("dusk.utils.arrayEqual");
		
		test.assertTrue(utils.arrayEqual([], []));
		test.assertFalse(utils.arrayEqual([], [1]));
		test.assertTrue(utils.arrayEqual([1, 2, 3], [1, 2, 3]));
		test.assertFalse(utils.arrayEqual([1, 2, 3], [1, 2, 5]));
		
		
		test.start("dusk.utils.arrayUnion");
		
		test.assertEqual(
			utils.arrayUnion([], []),
			[]
		);
		
		test.assertEqual(
			utils.arrayUnion([1, 2], [2]),
			[2]
		);
		
		test.assertEqual(
			utils.arrayUnion([1, 2, 3], [2, 3]).sort(function(a,b){return a-b}),
			[2, 3]
		);
		
		
		test.start("dusk.utils.dataToString and dusk.utils.stringToData");
		
		var ab = new Uint32Array(500);
		for(var i = ab.length-1; i >= 0; i --) {
			ab[i] = i;
		}
		
		test.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_HEX))
				),
				ab
			)
		);
		
		test.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_BC16))
				),
				ab
			)
		);
		
		var ab = new Uint32Array(500);
		for(var i = ab.length-1; i >= 0; i --) {
			ab[i] = 50;
		}
		
		test.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_HEX))
				),
				ab
			)
		);
		
		test.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_BC16))
				),
				ab
			)
		);
	});
})());
