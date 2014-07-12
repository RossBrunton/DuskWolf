//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test.dusk.utils", (function() {
	var test = load.require("test");
	var utils = load.require("dusk.utils");
	
	test.registerTestFunction("test.dusk.utils", function(tester) {
		tester.start("dusk.utils.clone");
		
		tester.assertEqual(1, utils.clone(1));
		tester.assertEqual({}, utils.clone({}));
		tester.assertEqual([], utils.clone([]));
		
		tester.assertEqual({"tester":"tester"}, utils.clone({"tester":"tester"}));
		tester.assertEqual({"tester":{}}, utils.clone({"tester":{}}));
		tester.assertEqual({"testerA":{}, "testerB":{}}, utils.clone({"testerA":{}, "testerB":{}}));
		tester.assertEqual({"testerA":{"p":1}, "testerB":{}},utils.clone({"testerA":{"p":1}, "testerB":{}}));
		
		tester.assertEqual([1, 2, 3], utils.clone([1, 2, 3]));
		tester.assertEqual([[1], [2], [3]], utils.clone([[1], [2], [3]]));
		tester.assertEqual([[[[[1]]]]], utils.clone([[[[[1]]]]]));
		
		
		tester.start("dusk.utils.merge");
		
		tester.assertEqual({}, utils.merge({}, {}));
		tester.assertEqual({"a":1}, utils.merge({"a":1}, {}));
		tester.assertEqual({"a":1}, utils.merge({}, {"a":1}));
		tester.assertEqual({"a":2}, utils.merge({"a":1}, {"a":2}));
		tester.assertEqual({"a":1, "b":2}, utils.merge({"a":1}, {"b":2}));
		
		
		tester.start("dusk.utils.doesImplement");
		
		var cls = function(){};
		cls.a = function(){};
		cls.b = function(){};
		cls.c = function(){};
		
		tester.assertTrue(utils.doesImplement(cls, ["a", "b"]));
		tester.assertTrue(!utils.doesImplement(cls, ["a", "d"]));
		tester.assertTrue(utils.doesImplement(cls, {"a":function(){}}));
		tester.assertTrue(!utils.doesImplement(cls, {"d":function(){}}));
		
		
		tester.start("dusk.utils.createCanvas");
		
		var can = document.createElement("canvas");
		can.width = 100;
		can.height = 100;
		
		tester.assertEqual(utils.createCanvas(100, 100), can);
		tester.assertNotEqual(utils.createCanvas(10, 10), can);
		
		
		tester.start("dusk.utils.urlGet");
		
		tester.assertEqual(utils.urlGet("a", "http://example.com/?a=1&b=2&c=3"), "1");
		tester.assertEqual(utils.urlGet("b", "http://example.com/?a=1&b=2&c=3"), "2");
		tester.assertEqual(utils.urlGet("c", "http://example.com/?a=1&b=2&c=3"), "3");
		tester.assertEqual(utils.urlGet("d", "http://example.com/?a=1&b=2&c=3"), null);
		
		
		/*tester.start("utils.isJson");
		
		tester.assertTrue(utils.isJson("{}"));
		tester.assertTrue(utils.isJson('{"a":1}'));
		tester.assertTrue(utils.isJson('{"a":1, "b":2}'));
		tester.assertTrue(utils.isJson('{"a":1, "b":2, "c":[]}'));
		tester.assertTrue(utils.isJson('{"a":1, "b":2, "c":[{}, {"a":2}]}'));
		
		tester.assertTrue(!utils.isJson("{"));
		tester.assertTrue(!utils.isJson("}"));
		tester.assertTrue(!utils.isJson('{"a":1, "b":2, "c":[{}, {'));*/
		
		
		tester.start("dusk.utils.jsonParse");
		
		tester.assertEqual(utils.jsonParse("{}"), {});
		tester.assertEqual(
			utils.jsonParse('{"a":1, "b":2, "c":[3, 4, 5]}'), {"a":1, "b":2, "c":[3, 4, 5]}
		);
		tester.assertEqual(
			utils.jsonParse('{"a":1, /*"b":2,*/ "c":[3, 4, 5]}'), {"a":1, "c":[3, 4, 5]}
		);
		tester.assertEqual(
			utils.jsonParse('{"a":1, "b":"a\nb\tc", "c":[3, 4, 5]}'),
			{"a":1, "b":"a b c", "c":[3, 4, 5]}
		);
		
		
		tester.start("dusk.utils.verCompare");
		
		tester.assertEqual(utils.verCompare("1", "1"), 0);
		tester.assertEqual(utils.verCompare("2", "1"), 1);
		tester.assertEqual(utils.verCompare("0", "1"), -1);
		
		tester.assertEqual(utils.verCompare("1.1", "1.1"), 0);
		tester.assertEqual(utils.verCompare("1.2", "1.1"), 1);
		tester.assertEqual(utils.verCompare("1.0", "1.1"), -1);
		
		tester.assertEqual(utils.verCompare("1", "1.1"), -1);
		tester.assertEqual(utils.verCompare("1.1", "1"), 1);
		
		tester.assertEqual(utils.verCompare("1alpha1", "1.1"), 0);
		tester.assertEqual(utils.verCompare("1alpha2", "1.1"), 1);
		tester.assertEqual(utils.verCompare("1alpha0", "1.1"), -1);
		
		tester.assertEqual(utils.verCompare("11", "11"), 0);
		tester.assertEqual(utils.verCompare("12", "11"), 1);
		tester.assertEqual(utils.verCompare("10", "11"), -1);
		
		
		tester.start("dusk.utils.lookup");
		var a = {};
		a.b = {};
		a.b.c = {};
		
		tester.assertEqual(utils.lookup(a, ""), a);
		tester.assertEqual(utils.lookup(a, "b"), a.b);
		tester.assertEqual(utils.lookup(a, "b.c"), a.b.c);
		
		tester.assertNotExists(utils.lookup(a, "b.c.d"));
		
		
		tester.start("dusk.utils.resolveRelative");
		
		tester.assertEqual(
			utils.resolveRelative("http://www.example.com/a", "http://www.example.com/"),
			"http://www.example.com/a"
		);
		
		tester.assertEqual(
			utils.resolveRelative("/a", "http://www.example.com/"),
			"/a"
		);
		
		tester.assertEqual(
			utils.resolveRelative("a", "http://www.example.com/"),
			"http://www.example.com/a"
		);
		
		tester.assertEqual(
			utils.resolveRelative("a/b", "http://www.example.com/"),
			"http://www.example.com/a/b"
		);
		
		
		tester.start("dusk.utils.arrayEqual");
		
		tester.assertTrue(utils.arrayEqual([], []));
		tester.assertFalse(utils.arrayEqual([], [1]));
		tester.assertTrue(utils.arrayEqual([1, 2, 3], [1, 2, 3]));
		tester.assertFalse(utils.arrayEqual([1, 2, 3], [1, 2, 5]));
		
		
		tester.start("dusk.utils.arrayIntersect");
		
		tester.assertEqual(
			utils.arrayIntersect([], []),
			[]
		);
		
		tester.assertEqual(
			utils.arrayIntersect([1, 2], [2]),
			[2]
		);
		
		tester.assertEqual(
			utils.arrayIntersect([1, 2, 3], [2, 3]).sort(function(a,b){return a-b}),
			[2, 3]
		);
		
		
		tester.start("dusk.utils.dataToString and dusk.utils.stringToData");
		
		var ab = new Uint32Array(500);
		for(var i = ab.length-1; i >= 0; i --) {
			ab[i] = i;
		}
		
		tester.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_HEX))
				),
				ab
			)
		);
		
		tester.assertTrue(
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
		
		tester.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_HEX))
				),
				ab
			)
		);
		
		tester.assertTrue(
			utils.arrayEqual(
				new Uint32Array(
					utils.stringToData(utils.dataToString(ab.buffer, utils.SD_BC16))
				),
				ab
			)
		);
	});
})());
