'use strict';
/*global test,suite*/

var abbr = require('../index');
var assert = require('assert');

suite("abbr", function(){

	test('trivial', function(){
		assert.equal(abbr.abbreviate("str"), "str");
		assert.equal(abbr.abbreviate(1), 1);
		assert.equal(abbr.abbreviate(null), null);
	});

	test('copy', function(){
		var a = {greetings: {hello: "world"}};
		assert.notEqual(abbr.abbreviate(a), a);
		assert.equal(JSON.stringify(abbr.abbreviate(a)), JSON.stringify(a));
	});

	test('circular', function(){
		var circular = {};
		circular.circular = circular;
		JSON.stringify(abbr.abbreviate(circular));
	});

	test('removesGlobal', function(){
		assert.equal(JSON.stringify(abbr.abbreviate({
			global:global
		},{
			filter: abbr.nodeFilter,
		})),
		'{"global":"**global**"}');
	});

	test('maxStringLength', function(){
		var source = {
			long: 'begin' + new Array(30000).join('banana') + 'end',
		};
		var result = abbr.abbreviate(source);

		assert(source.long.length > 132000, 'long input');
		assert(result.long.length < 132000, 'short output');
		assert(result.long.indexOf('begin') != -1, 'keep begin');
		assert(result.long.indexOf('end') != -1, 'keep end');
		assert(result.long.indexOf('…') != -1, 'mark break');
	});

	test('maxStringTotalSize', function(){
		var longStrings = [
			[ new Array(10000).join('banana') ],
			{ obj: new Array(10000).join('banana') },
			new Array(10000).join('banana'),
		];

		// maxSize is very rough, so allow some difference
		assert(JSON.stringify(abbr.abbreviate(longStrings, {maxSize: 50000})).length < 65000);
	});

	test('maxOverheadSize', function(){
		var result = abbr.abbreviate(new Array(1000).join('abcd').split(''), {maxSize: 4000});

		assert(JSON.stringify(result).length < 4000, 'len' + JSON.stringify(result).length);
	});

	test('errorProperties', function testFunctionName(){
		var result = abbr.abbreviate({
			prop: new TypeError("Hello")
		}, {filter: abbr.nodeFilter});

		assert.equal(result.prop.name, "TypeError");
		assert.equal(result.prop.message, "Hello");
		assert(/testFunctionName/.test(result.prop.stack));
	});

	test('topLevelFilter', function(){
		var custom = Error("Custom");
		custom.customProperty = "added";
		var result = abbr.abbreviate(custom, {filter: abbr.nodeFilter});

		assert.equal(result.name, "Error");
		assert.equal(result.message, "Custom");
		assert.equal(result.customProperty, "added");
	});
});
