'use strict';

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
});
