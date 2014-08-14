'use strict';

var util = require('util');


/** @const */
var STRING_MAX_LENGTH = 128*1024;

/**
 * Create a copy of any object without non-serializable elements to make result safe for JSON.stringify().
 * Guaranteed to never throw.
 *
 * @param {Any}    obj     Any data structure
 * @param {Object} options {filter, maxDepth}
 *
 * Options:
 * filter: callback that is called on every object's key with (key,value) and should return value to use
 * (may return undefined to remove unwanted keys). See nodeFilter and browserFilter.
 *
 * depth: maximum recursion depth. Elements deeper than that are stringified with util.inspect()
 *
 * maxSize: roughly maximum allowed size of data after JSON serialisation (but it's not guaranteed that it won't exceed the limit)
 */
function abbreviate(obj, options) {
	if (!options) options = {};

	var filter = options.filter || function(k,v){return v;};
	var maxDepth = options.depth || 10;
	var maxSize = options.maxSize || 1*1024*1024;

	return abbreviateRecursive(obj, filter, {sizeLeft: maxSize}, maxDepth);
}

function limitStringLength(str) {
	if (str.length > STRING_MAX_LENGTH) {
		return str.substring(0, STRING_MAX_LENGTH/2) + ' … ' + str.substring(str.length - STRING_MAX_LENGTH/2);
	}
	return str;
}

function abbreviateRecursive(obj, filter, state, maxDepth) {
	if (state.sizeLeft < 0) {
		return '**skipped**';
	}

	state.sizeLeft -= 5; // rough approximation of JSON overhead

	try {
		switch(typeof obj) {
			case 'object':
				if (null === obj) {
					return null;
				}
				if (maxDepth < 0) {
					break; // fall back to util.inspect
				}

				var newobj = Array.isArray(obj) ? [] : {};
				for(var i in obj) {
					newobj[i] = abbreviateRecursive(filter(i, obj[i]), filter, state, maxDepth-1);
					if (state.sizeLeft < 0) break;
				}
				return newobj;

			case 'string':
				obj = limitStringLength(obj);
				state.sizeLeft -= obj.length;
				return obj;

			case 'number':
			case 'boolean':
			case 'undefined':
				return obj;
		}
	} catch(e) {/* fall back to inspect*/}

	try {
		obj = limitStringLength(util.inspect(obj, {depth: 1}));
		state.sizeLeft -= obj.length;
		return obj;
	} catch(e) {
		return "**non-serializable**";
	}
}


function nodeFilter(key, val) {
	if ('function' === typeof val) {
		return undefined;
	}

	// domain objects are huge and have circular references
	if (key === 'domain' && 'object' === typeof val && val._events) {
		return "**domain ignored**";
	}
	if (key === 'domainEmitter') {
		return "**domainEmitter ignored**";
	}

	if (val === global) {
		return "**global**";
	}

	if (val instanceof Date) {
		return "**Date** " + val;
	}

	return val;
}

function browserFilter(key, val) {
	if ('function' === typeof val) {
		return undefined;
	}

	if (val === window) {
		return "**window**";
	}

	if (val === document) {
		return "**document**";
	}

	if (val instanceof Date) {
		return "**Date** " + val;
	}

	if (val instanceof HTMLElement) {
		var outerHTML = val.outerHTML;
		if ('undefined' != typeof outerHTML) {
			return "**HTMLElement** " + outerHTML;
		}
	}

	return val;
}


module.exports = {
	abbreviate: abbreviate,
	nodeFilter: nodeFilter,
	browserFilter: browserFilter,
};
