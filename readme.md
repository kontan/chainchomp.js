chainchomp.js: Lightweight JavaScript Sandbox
------------------------------

**This library is experimental. Some vulnerability may be found and the project may abort if unfixable security holes are found.**

chainchomp.js is a tool to evaluate untrusted third-party scripts on your web pages in safety. This project have the same goal as　[Google Caja](https://code.google.com/p/google-caja/), [ADsafe](http://www.adsafe.org/) or [JSandbox](https://github.com/eligrey/jsandbox). However, this library explores a different approach from those projects.

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

## Restriction

* **You should set a custom property to objects exposed at guest codes with extreme caution.**　For example, in host code, `Number.prototype.window = window` breaks the sandbox because the guest code steal the global object via `Number.prototype.window`. This library can't fix that kinds of vulnerability. 

* **The global objects, such as `String`, `Array` and `decodeURI` are freezed in both of host codes and guest codes.**

* `Function` are banned in guest codes. ( `Function === undefined` )
* `eval` are banned in guest codes. ( `eval === undefined` )
* `Function.prototype.constructor` are banned. (`Function.prototype.constructor === undefined`)
* All guest code runs under Strict mode. 
* Can't detect infinite loops in codes.


## What's Chain Chomp?

[Chomp chomp!](https://www.google.co.jp/search?q=Chain+Chomp&tbm=isch)