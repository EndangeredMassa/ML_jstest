$(document).ready(function(){
	//Custom error type
	var MyError = function(msg){
		this.message = msg;
		this.name = "MyError";
	};
	
	jstest({
		
		testAssertEquals: function(){
			assert.isEqual(1,function(a,b){return a+b;});
		},
		test2: function(){
			throw new Error("custom error message that is very long custom error message that is very long custom error message that is very long");
		},
		testAssertNotNull: function(){
			var div = document.createElement('div');
			assert.notNull(div);
		},
		testAttributeTestSetup: [
			[jstest.TestSetup], 
			function(){
				console.log("Attribute Test - TestSetup!");
			}
		],
		testAttributeTestTeardown: [
			[jstest.TestTeardown], 
			function(){
				console.log("Attribute Test - TestTeardown!");
			}
		],
		testAttributeSuiteSetup: [
			[jstest.SuiteSetup], 
			function(){
				console.log("Attribute Test - SuiteSetup!");
			}
		],
		testAttributeSuiteTeardown: [
			[jstest.SuiteTeardown], 
			function(){
				console.log("Attribute Test - SuiteTeardown!");
			}
		],
		testAttributeIgnore: [
			[jstest.Ignore], 
			function(){
				var msg = "DO NOT DISPLAY THIS MESSAGE!";
				console.log(msg);
				throw new Error(msg);
			}
		],
		
		//testing ExpectsException
		testAttributeExpectedException1_FAIL: [
			[jstest.ExpectsException(MyError)],
			function(){
				throw new Error("testing ExpectedException!");
			}
		],
		testAttributeExpectedException2_FAIL: [
			[jstest.ExpectsException(MyError)
			,jstest.ExpectsException(RangeError)],
			function(){
				throw new Error("testing ExpectedException!");
			}
		],
		testAttributeExpectedException1_PASS: [
			[jstest.ExpectsException(MyError)
			,jstest.ExpectsException(RangeError)],
			function(){
				throw new RangeError("testing ExpectedException!");
			}
		],
		testAttributeExpectedException2_PASS: [
			[jstest.ExpectsException(MyError)
			,jstest.ExpectsException(RangeError)],
			function(){
				throw new MyError("testing ExpectedException!");
			}
		],
		
		//testing assert.notEqual
		testNotEqual_PASS: function() {
			assert.notEqual(1,3);
		},
		testNotEqual_FAIL: [
			[jstest.ExpectsException(Error)],
			function() {
				assert.notEqual(1,1);
			}
		],
		
		testExpectsException_FAIL: [
			[jstest.ExpectsException(MyError)
			,jstest.ExpectsException(RangeError)],
			function() {
				//do nothing
			}
		],
		
		testLength: function() {
			//do nothing
		}
	});
});
