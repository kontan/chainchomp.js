test("pretest", function() {
	// A guest code can get the Global object with Function construtor
	// So Function must be banned.
	ok(window === new Function('return this')())

	// Function.prototype is readonly
	Function.prototype = 'hoge';
	ok(Function != 'hoge');

	// can get Function via Function.prototype.constructor
	ok(Function.prototype.constructor === Function);

	// So, a guest code can get Function via annonymous function and __proto__
	ok((function(){}).__proto__.constructor === Function)

	// Function.prototype.constructor must be overwrited
	Function.prototype.constructor = undefined;
	throws(function(){ (function(){}).__proto__.constructor('return this') }, TypeError);
	Function.prototype.constructor = Function;

	// Or any stub function should be provided?
	// It will removes a error but I think it makes no sence...
	Function.prototype.constructor = function(){ return function(){}; };
	ok((function(){}).__proto__.constructor('return this')() === undefined);
	Function.prototype.constructor = Function;
	ok(Function.prototype.constructor === Function);

	// In Strict mode, undefined is read only 
	throws(function(){'use strict'; undefined = "hoge";	}, TypeError);

	// In Strict mode, null is invalid as left side value 
	throws(function(){'use strict'; null = "hoge";	}, ReferenceError);

	// some global object is readonly but some one is not...
	
	// NaN behavior
	ok(NaN !== NaN); // NaN is mysterious ...
	ok(NaN !== Number.NaN);
	ok(isNaN(NaN) && isNaN(Number.NaN));
	NaN = "hoge"; // NaN is readonly
	ok(NaN !== "hoge");	
	NaN.hoge = "hoge";
	ok(NaN.hoge !== "hoge");
	var nan = NaN;
	nan.hoge = "hoge";
	ok(nan.hoge !== "hoge");

	// decodeURIComponent is not readonly
	var _decodeURIComponent = decodeURIComponent;
	decodeURIComponent = "hoge";
	ok(decodeURIComponent === "hoge");
	decodeURIComponent = _decodeURIComponent;
});

test("general evalution", function() {
	strictEqual(chainchomp('return 1 + 2 * 3 - 4;'), 1 + 2 * 3 - 4);
	strictEqual(chainchomp('return Math.sin(3.14);'), Math.sin(3.14));
	strictEqual(chainchomp('return encodeURIComponent("http://example.com/");'), "http%3A%2F%2Fexample.com%2F");
});

test("strict mode violation", function() {
	throws(function(){ chainchomp('foo = 100;'); }, ReferenceError);
	throws(function(){ chainchomp('var x; delete x;'); }, SyntaxError);
	throws(function(){ chainchomp('return arguments.callee;'); }, TypeError);
});

test("global object steal", function() {
	strictEqual(chainchomp('return window;'), undefined);
	strictEqual(chainchomp('return this;'), undefined);
   	strictEqual(chainchomp('return (function(){return this})();'), undefined);
   	throws(function(){ chainchomp('return ("global",eval)("this");'); }); 
   	throws(function(){ chainchomp('return new Function("return this")();'); }); 
   	throws(function(){ chainchomp('return (function(){}).constructor("return this")();'); });
   	throws(function(){ chainchomp('return (function(){}).constructor;'); }, ReferenceError);
   	throws(function(){ chainchomp('(function(){}).__proto__.apply = 100;'); }, TypeError);
   	ok((function(){}).__proto__.apply !== 100);
});

test( "window object aceess", function() {
   	throws(function(){ chainchomp('window.location = "http://example.com/";'); }, TypeError);
   	throws(function(){ chainchomp('__proto__.hoge = "hoge"'); }, TypeError);   	
});

test( "callback safety", function() {
   	throws(function(){ chainchomp('return function(){ window.location = "http://example.com/"; };')(); });
});

test("global object overwriting", function() {
    chainchomp('Math = undefined;');
    ok(Math.abs(-10) === 10);

    throws(function(){ chainchomp('Math.sin = function(){ return 100; };') });
    ok(Math.sin(0) === 0);

    chainchomp('undefined = 10;');
    ok(undefined !== 10);
});

test("custom object safe access", function() {
	// Objects
	var Vector2 = Object.seal(function Vector2(x, y){ 
	    this.x = x || 0; 
	    this.y = y || 0; 
	});
	var print = function print(s){ 
	    console.log(s); 
	}
	var square = Object.seal(Object.prototype, {
	    name:      { writable: false, value: 'shape 1' },
	    position:  { writable: true,  value: new Vector2(10, 20) },
	    move:      { writable: false, value: function(dx, dy){ 
	    	this.position.x += dx;
	    	this.position.y += dy;  
	    }}
	});

	var scope = {
	    'print':   print,
	    'Vector2': Vector2,
	    'square':  square
	};

    var v = chainchomp('var v = new Vector2(10, 20); print(v.x); return v; ', scope);
    ok(v instanceof Vector2);
    ok(v.x === 10);
    ok(v.y === 20);

    throws(function(){ chainchomp('square.hoge = "invalid data";'); });    
});

test("external library access protection", function() {
	ok($("title").text() === 'chainchomp.js unit tests');
    throws(function(){ chainchomp('$("title").text("invalid text");'); });    
});

test("direct id acccess", function() {
	throws(function(){ chainchomp('var doc = qunit.ownerDocument; doc.querySelector("h1").textContent = "Cracked you!";'); });    
});

test("function properties acccess", function() {
	throws(function(){ chainchomp('var f = function(){};\n return f.constructor.apply(undefined, ["return this"]);'); });
	throws(function(){ chainchomp('var f = function(){};\n return f.constructor.call(undefined, "return this");'); });   
});

test("primitive implicit conversion aceess", function() {
	throws(function(){ chainchomp('var s = "hoge";\n s.__proto__.toString = function(){ return "hoge"; };'); });
	ok("piyo".toString() !== "hoge");
});

test("eval replacement attack", function() {
	throws(function(){ chainchomp('eval("1 + 2"); }'); });
	throws(function(){ chainchomp('eval = function(){ return "Cracked"; }'); });
	ok(eval("1 + 2") === 3);
});

test("undefined replacement attack", function() {
	chainchomp('undefined = 100;');
	ok(undefined !== 100);
});

test("function __proto__ attack", function() {
	throws(function(){ chainchomp('(function(){}).__proto__.__defineGetter__ = 100;'); });
	chainchomp('(function(){}).__proto__.__defineGetter__.__proto__ = 100;');
	ok((function(){}).__proto__.__defineGetter__.__proto__ !== 100);
});

test("primitive __proto__ overwriting attack", function() {
	throws(function(){ chainchomp('(0).__proto__.toString = function(){ return "hoge"; };'); });
	ok((0).__proto__.toString() === "0");
	ok((0).toString() === "0");
	ok((0) + "" === "0");

	throws(function(){ chainchomp('/a/.__proto__.toString = function(){ return "hoge"; };'); });
	strictEqual(/a/.toString(), "/a/");

	throws(function(){ chainchomp('new Date().__proto__.toString = function(){ return "hoge"; };'); });
	throws(function(){ chainchomp('new Date().toString = function(){ return "hoge"; };'); });
	ok(new Date().toString() !== "hoge");

});


test("function property test", function() {
	throws(function(){ chainchomp('return (function(){}).constructor("return this;");'); });
});
