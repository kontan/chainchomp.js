test("general evalution", function() {
	strictEqual(chainchomp('return 1 + 2 * 3 - 4;'), 1 + 2 * 3 - 4);
	strictEqual(chainchomp('return Math.sin(3.14);'), Math.sin(3.14));
	strictEqual(chainchomp('return encodeURIComponent("http://example.com/");'), "http%3A%2F%2Fexample.com%2F");
});

test("strict mode violation", function() {
	throws(function(){ chainchomp('foo = 100;'); });
});

test("global object steal", function() {
	strictEqual(chainchomp('return this;'), undefined);
   	strictEqual(chainchomp('return (function(){return this})();'), undefined);
   	throws(function(){ chainchomp('return ("global",eval)("this");'); }); 
   	throws(function(){ chainchomp('return new Function("return this")();'); }); 
   	throws(function(){ chainchomp('return (function(){}).constructor("return this")();'); });
   	strictEqual(chainchomp('return (function(){}).constructor;'), undefined);
   	chainchomp('(function(){}).__proto__.apply = 100;');
   	ok((function(){}).__proto__.apply !== 100);
});

test( "attacking window object", function() {
   	throws(function(){ chainchomp('window.location = "http://example.com/";'); });
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

	throws(function(){ chainchomp('var f = function(){};\n return f.__proto__.apply(undefined, ["return this"]);'); });
	throws(function(){ chainchomp('var f = function(){};\n return f.__proto__.call(undefined, "return this");'); });    
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