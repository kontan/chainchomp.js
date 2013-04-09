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

    console.log(chainchomp('return 1 + 2'));    // prints "3"

    chainchomp('window.location = "http://example.com/"');    // causes TypeError

    chainchomp('puts("Hello, World!");', { puts: function(s){ console.log(s); } });    // prints "Hello, World!"

## Demo

Let's play in [Demo page](http://kontan.github.io/chainchomp.js) and please report vulnerability.

## Restriction

* ***Some basic objects, such as `String`, `Number` and `Boolean` are freezed***. (`Object.freeze`) It may influences all your codes after `chainchomp` is called.
* `eval` and `Function` are banned in guest codes. ( `eval === undefined && Function === undefined` )
* All guest code runs under Strict mode. 
* Can't detect infinite loops in codes.


## What's Chain Chomp?

[Chomp chomp!](https://www.google.co.jp/search?q=Chain+Chomp&tbm=isch)