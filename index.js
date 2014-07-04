'use strict';

var util = require('util');

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
 */
function abbreviate(obj, options) {
	if (!options) options = {}

	return abbreviateRecursive(obj, options.filter || function(k,v){return v}, options.depth || 10);
}

function abbreviateRecursive(obj, filter, maxDepth) {
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
					newobj[i] = abbreviateRecursive(filter(i, obj[i]), filter, maxDepth-1);
				}
				return newobj;

			case 'number':
			case 'string':
			case 'boolean':
			case 'undefined':
				return obj;
		}
	} catch(e) {/* fall back to inspect*/}

	try {
		return util.inspect(obj, {depth: 1});
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
