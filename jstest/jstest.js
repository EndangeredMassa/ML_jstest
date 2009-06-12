/*!  
 * jstest JavaScript testing framework 
 * Sean Massa
 * www.massalabs.com/blog
 */ 
 
 "use strict";
 
(function() {

//Implement a blank console if one
// doesn't already exist.
if (typeof console === 'undefined') {
	var empty = function(){};
	window.console = {
		log: empty
		,debug: empty
		,info: empty
		,warn: empty
	};
}

//Accepts an exception constructor function and 
// stores it for later comparison
var ExpectedException = function(exConstructor){
	this.exConstructor = exConstructor;
};

//Creates the DOM container for our 
// test output
function createContainer() {		
	var div = document.createElement('div');
	div.style.position = "absolute";
	div.className = 'jstest-container';
	
	var header = document.createElement('div');
	header.innerHTML = 'jsTest';
	header.className = 'jstest-header';
	header.id = 'jstest-header';
	
	var content = document.createElement('div');
	content.className = 'jstest-content';
	content.id = 'jstest-content';
	
	var footer = document.createElement('div');
	footer.innerHTML = '-';
	footer.className = 'jstest-footer';
	footer.id = 'jstest-footer';
	
	div.appendChild(header);
	div.appendChild(content);
	div.appendChild(footer);
	document.body.appendChild(div);
	return content;
}

//Adds a test result to the container
function addTestResult(name, message, passed) {
	var div = document.createElement("div");
	div.innerHTML  = '<span class="jstest-name">' + name + '</span>' ;
	div.innerHTML += ': ' + (passed ? 'Passed!' : 'Failed!');
	div.innerHTML += (message !== '') ? ' <br /> ' + message : '';
	div.className = "jstest-test " + (passed ? "jstest-passed" : "jstest-failed");
	jstest.container.appendChild(div);
}

//Updates the footer message of the container
function updateStats(passed, failed) {
	var footer = document.getElementById('jstest-footer');
	var total = passed + failed;
	var percent = (passed / (total > 0 ? total : 1) * 100) + '';
	
	//trim long repeating decimals
	if(percent.indexOf(".") > 0) {
		percent = percent.substring(0,5);
	}
	var msg = 'Passed: ' + passed + ' / ' + total;
	msg    += ' = ' + percent + '%';
	footer.innerHTML = msg;
}

//Test constructor
function Test (method, name, attributes) {
	this.method = method;
	this.name = name;
	this.attributes = attributes;
	this.expectedExceptions = [];
	
	this.expectsException = function(expected){
		for(var ex in this.expectedExceptions) {
			if (expected === this.expectedExceptions[ex]) {
				return true;
			}
		}
		return false;
	};
	
	this.expectsAnyException = function() {
		return this.expectedExceptions.length > 0;
	};
	
	this.expectException = function(ex){
		if (ex === null) { return; }
		if (typeof ex !== "function") { return; }
		
		this.expectedExceptions.push(ex);
	};
	
	this.getExpectedExceptionList = function () {
		var list = [];
		
		for (var i in this.expectedExceptions) {
			//Create a new instance of the exception
			// so that we can grab the name
			var ex = new this.expectedExceptions[i]();
			list.push(ex.name);
		}
		
		return list;
	};
}

//Normalizes our tests into our Test type
function normalizeTests(tests){
	var normalized = [];
	
	var sorter = function(a,b) {
		if(typeof a !== 'number') {
			return 1;
		}
		if(typeof b !== 'number') {
			return -1;
		}
		return (a - b);
	};
	
	for(var test in tests) {
		var name = test;
		if(tests[test].constructor === Function) {
			normalized.push(
				new Test(tests[test], name, null)
			);
		} else if (tests[test].constructor === Array) {
			var attributes = tests[test][0];
			var method = tests[test][1];
			
			//Sort attributes by number, then by 
			// non-number types
			attributes.sort(sorter);
			normalized.push(
				new Test(method,name,attributes)
			);
		}
	}
	return normalized;
}

//Suite constructor
function Suite(tests) {
	var empty = function(){};
	this.suiteSetup = empty;
	this.suiteTeardown = empty;
	this.testSetup = empty;
	this.testTeardown = empty;
	this.tests = [];
	
	var normalizedTests = normalizeTests(tests);
	
	this.removeTest = function (remTest) {
		var newTests = [];
		for (var test in this.tests) {
			if (this.tests[test] !== remTest) {
				newTests.push(this.tests[test]);
			}
		}
		
		this.tests = newTests;
	};
	
	for( var test in normalizedTests ) {
		var nTest = normalizedTests[test];
		
		if(nTest.attributes !== null) {
			for(var a in nTest.attributes) {
				var attr = nTest.attributes[a];
				
				if(attr === jstest.Ignore) {
					//"Ignore" will be first; so breaking out 
					//here will skip the other attributes
					break;
				} else if (attr === jstest.TestSetup) {
					if (this.testSetup !== empty) {
						throw new Error("Cannot use more than one TestSetup attribute.");
					}
					this.testSetup = nTest.method;
				} else if (attr === jstest.TestTeardown) {
					if (this.testTeardown !== empty) {
						throw new Error("Cannot use more than one TestTeardown attribute.");
					}
					this.testTeardown = nTest.method;
				} else if (attr === jstest.SuiteSetup) {
					if (this.suiteSetup !== empty) {
						throw new Error("Cannot use more than one SuiteSetup attribute.");
					}
					this.suiteSetup = nTest.method;
				} else if (attr === jstest.SuiteTeardown) {
					if (this.suiteTeardown !== empty) {
						throw new Error("Cannot use more than one SuiteTeardown attribute.");
					}
					this.suiteTeardown = nTest.method;
				} else if (attr.constructor === ExpectedException) {
					//TODO: Clean this up
					this.removeTest(nTest);
					nTest.expectException(attr.exConstructor);
					this.tests.push(nTest);
					
				} else {
					this.tests.push(nTest);
				}
			}
		} else {
			this.tests.push(nTest);
		}
	}
}

//Runs the test suite that we've normalized
//TODO: Refactor this to use setTimeout so that
// the screen rendering can be updated between tests.
function runSuite(suite) {
	var passed = 0;
	var failed = 0;	
	
	function pass(name) {
		var msg = '';
		addTestResult(name, msg, true);
		passed++;
	}
	
	function fail(name, exMessage) {
		addTestResult(name, exMessage, false);
		failed++;
	}
	
	suite.suiteSetup();
	
	for(var test in suite.tests) {
		var sTest = suite.tests[test];
		
		suite.testSetup();
		
		try {
			sTest.method();
			if(sTest.expectsAnyException()) {
				var exceptions = sTest.getExpectedExceptionList();
				var exList = exceptions.join(', ');
				var msg = 'Expected Exception(s): ' + exList;
				
				fail(sTest.name, msg);
			} else {
				pass(sTest.name);
			}
		} catch (ex) {
			if(sTest.expectsException(ex.constructor)) {
				pass(sTest.name);
			} else {
				fail(sTest.name, ex.message);
			}
		}
		
		suite.testTeardown();
	}
	
	suite.suiteTeardown();
	
	updateStats(passed, failed);
}

var jstest = window.jstest = function(tests) {
	jstest.container = createContainer();
	var suite = new Suite(tests);
	runSuite(suite);
};

//Test Atributes
jstest.Ignore = -1; //this must be the lowest number value of all types
jstest.TestSetup = 1;
jstest.TestTeardown = 2;
jstest.SuiteSetup = 3;
jstest.SutieTeardown = 4;
jstest.ExpectsException = function(ex){ return new ExpectedException(ex); };

//Returns a stack trace
jstest.Trace = function() { 
	try { throw new Error(); } catch(ex) { return ex.stack; } 
};

//Assert Exception type constructor
var AssertFailure = function(msg) {
	this.name = "AssertFailure";
	this.message = msg;
};

//Assert object intializer
var assert = window.assert = {
	/*
		For isEqual and notEqual, we only show types 
		if they are 1) different or	2) a primitave type. 
		Otherwise, we will get things like (object)[object Object], 
		which doesn't give us any extra information.
	*/
	isEqual: function(actualValue, expectedValue) {
		if (actualValue !== expectedValue) {
			var expectedType = typeof expectedValue;
			var actualType = typeof actualValue;
			
			if (actualType === expectedType) {
				expectedType = actualType = '';
			} else {
				if (expectedType === 'object') {
					expectedType = '';
				} else if (expectedType === 'function') {
					expectedType = '';
				} else {
					expectedType = '(' + expectedType + ')';
				}
				
				if (actualType === 'object') {
					actualType = '';
				} else if (actualType === 'function') {
					actualType = '';
				} else {
					actualType = '(' + actualType + ')';
				}	
			}
			
			var msg = "Expected " 
				+ expectedType + expectedValue 
				+ " but received " 
				+ actualType + actualValue + '.';
			throw new AssertFailure(msg);
		}
	},
	notEqual: function(valueA, valueB) {
		if (valueA === valueB) {
			var typeA = typeof valueA;
			var typeB = typeof valueB;
			
			if (typeA === typeB) {
				typeA = typeB = '';
			} else {
				if (typeA === 'object') {
					typeA = '';
				} else if (typeA === 'function') {
					typeA = '';
				} else {
					typeA = '(' + typeA + ')';
				}
				
				if (typeB === 'object') {
					typeB = '';
				} else if (typeB === 'function') {
					typeB = '';
				} else {
					typeB = '(' + typeB + ')';
				}	
			}
			
			//TODO: Update this message to make more sense.
			var msg = "Values should not be equal: " 
				+ typeA + valueA 
				+ " and " 
				+ typeB + valueB + '.';
			throw new AssertFailure(msg);
		}
	},
	notNull: function(value) {
		if (value === null) {
			throw new AssertFailure("Unexpected null Value.");
		}
	},
	isNull: function(value) {
		if (value !== null) {
			throw new AssertFailure("Expected null Value, but got " + value + ".");
		}
	},
	isTrue: function(flag) {
		if (flag !== true) {
			throw new AssertFailure("Expected true.");
		}
	},
	isFalse: function(flag) {
		if (flag !== false) {
			throw new AssertFailure("Expected false.");
		}
	}
};

})();
