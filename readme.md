chainchomp.js: Lightweight JavaScript Sandbox
------------------------------

**This library is experimental. Some vulnerability may be found and the project may abort if unfixable security holes are found.**

## Abstract

chainchomp.js is a tool to evaluate untrusted third-party scripts on your web pages in safety. This project have the same goal as　[Google Caja](https://code.google.com/p/google-caja/), [ADsafe](http://www.adsafe.org/) or [JSandbox](https://github.com/eligrey/jsandbox). However, this library explores a different approach from those projects.

A sandboxed script runs with small overhead. Creating sandboxed function takes 10-20 millisecond if the web page is simple and invocation of the function needs very few additional cost.  

The API is very simple and easy to use. You need a calling of only one function `chainchomp()`. 
Usage of the function is very similar to `eval` function. 


## Usage

To use chainchomp.js, add the following line to your html code:

    <script src="https://raw.github.com/kontan/chainchomp.js/master/chainchomp.js"></script>

Now chainchomp.js provides only one function:

    function chainchomp(script: string, scope?: any, options?: any): any;

## Examples

Basic evaluation:

    console.log(chainchomp('return 1 + 2'));    
    // prints "3"

Unexpected page jumping attack:

    chainchomp('window.location = "http://example.com/"');    
    // causes TypeError

Passing custom properties:

    var scope = { puts: function(s){ console.log(s); } };
    chainchomp('puts("Hello, World!");', scope);
    // prints "Hello, World!"

Callback to guest codes:

    var scope = { puts: function(s){ console.log(s); } };
    var f = chainchomp('puts(new Date())', scope);
    setInterval(f, 1000);
    // prints datetime every seconds

Invalid callback attack:

    var scope = { puts: function(s){ console.log(s); } };
    var f = chainchomp('window.location = "http://example.com/";', scope);
    setInterval(f, 1000);
    // causes TypeError    

## Demo

Let's play in [Demo page](http://kontan.github.io/chainchomp.js) and please report vulnerability.

## Security Warnings

#### Modifying global objects
Unfortunately, sandboxing in chainchomp.js is very fragile. 
Guest code global objects such as `Number`, `Math` and etc are shared with host codes and guest codes.
Those objects are freezed at first calling of `chainchomp()` but you can change properties of those objects before freezing.
For example, in host codes, the following code easily breaks the sandbox:
    
    Number.prototype.window = window;

beacause guest codes always can access `Number` and get the global object via `Number.prototype.window`. 
So the browser may jump to unexpected　URL by a guest code such that:

     Number.prototype.window.location = 'http://some.malicious.url/';

chainchomp.js can't find and fix those vulnerability. 
You should avoid change any properties of the guest code global objects as possible when you use chainchomp.js. 

#### Changing property of the global object

(Don't mistake "Global objects" for "Global object". "Global objects" refers `Number`, `Math` and etc. 
"Global object" equals  `window` in Web browser. )

For performance reason, you can create "environment" and "sandboxed function" separately. 
For example, if you want to call same function many times: 

    var env = chainchomp.pick();
    var scope = { i: 0 };
    var f = env("return i", scope);
    for(var i = 0; i < 10000; i++){
        scope.i = i;
        console.log(f());
    }

However, the following host code have a security hole. 
A property `hoge` of `window` is not protect from the guest code because chainchomp.js's sandbox is blacklist style.

    var env = chainchomp.pick();
    
    window.hoge = "hoge";

    var scope = { i: 0 };
    var f = env('hoge = "piyo";', scope);
    for(var i = 0; i < 10000; i++){
        scope.i = i;
        console.log(f());
    }

    console.log(window.hoge);

When `chainchomp.pick` is called, `window` don't have a property `hoge` and the blacklist doesn't contains `hoge`.
So the guest code can modify `window.hoge` with just `hoge = "piyo";`. Using 'chainchomp()' is safe for the vulnerability.

## Restrictions

* Guest code global objects, such as `String`, `Array` and `decodeURI` are freezed in both of host codes and guest codes when `chainchomp()` is called.
* `Function` are banned in guest codes. ( `Function === undefined` )
* `eval` are banned in guest codes. ( `eval === undefined` )
* `Function.prototype.constructor` are banned in both of host codes and guest codes. (Causes ReferenceError)
* All guest code runs under Strict mode. 
* Can't detect infinite loops in guest codes.　`for(;;);` in guest code will stop whole of script of the page. Users manualy need to stop.

## What's Chain Chomp?

[Chomp chomp!](https://www.google.co.jp/search?q=Chain+Chomp&tbm=isch)