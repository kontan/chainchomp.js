test("general evalution", function() {
	strictEqual(chainchomp('return 1 + 2 * 3 - 4;'), 1 + 2 * 3 - 4);
	strictEqual(chainchomp('return Math.sin(3.14);'), Math.sin(3.14));
	strictEqual(chainchomp('return encodeURIComponent("http://example.com/");'), "http%3A%2F%2Fexample.com%2F");
});

test("strict mode violation", function() {
	throws(function(){ chainchomp('foo = 100;'); });
});

test("global object steal", function() {
	throws(function(){ chainchomp('var global = this; global.hoge = "invalid data";'); });
   	throws(function(){ chainchomp('var global = (function(){return this})(); global.hoge = "invalid data";'); });
   	throws(function(){ chainchomp('var global = ("global",eval)("this"); global.hoge = "invalid data";'); }); 
   	throws(function(){ chainchomp('var global = new Function("return this")(); global.hoge = "invalid data";'); }); 
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

	chainchomp('log(__proto__); __proto__ = 20;', { log: function(s){ console.log(s);} });
    ok(__proto__ !== 20);
    ok(window.__proto__ !== 20);

    chainchomp('log(prototype); prototype = 30;', { log: function(s){ console.log(s);} });
    ok(window.prototype !== 30);
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

test("function constructor acccess", function() {
	throws(function(){ chainchomp('var f = function(){};\n return f.constructor.apply(undefined, ["return this"]);'); });
	throws(function(){ chainchomp('var f = function(){};\n return f.constructor.call(undefined, "return this");'); });    
});

test("primitive implicit conversion aceess", function() {
	throws(function(){ chainchomp('var s = "hoge";\n s.__proto__.toString = function(){ return "hoge"; };'); });
	ok("piyo".toString() !== "hoge");
});