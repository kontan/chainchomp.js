chainchomp.js: Lightweight JavaScript Sandbox
------------------------------

**This project is experimental. Some vulnerability may be found and the project may abort.**

## Usage

To use chainchomp.js, add the following line to your html code:

    <script src="https://raw.github.com/kontan/chainchomp.js/master/chainchomp.js"></script>

Now chainchomp.js provides only one function:

    function chainchomp(script: string, scope?: any, options?: any): any;

## Example

    console.log(chainchomp('return 1 + 2'));    // prints "3"

    chainchomp('window.location = "http://example.com/"');    // TypeError

    chainchomp('puts("Hello, World!");', { puts: function(s){ console.log(s); } });    // prints "Hello, World!"

## Demo

Let's play in [Demo page](http://kontan.github.io/chainchomp.js) and report vulnerability.

## Restriction

* ***Some basic objects, such as `String`, `Number` and `Boolean` are freezed***. (`Object.freeze`) It may influences all your codes after `chainchomp` is called.
* `eval` and `Function` are banned in guest codes. ( `eval === undefined && Function === undefined` )
* All guest code runs under Strict mode. 


## What's Chain Chomp?

[Chomp chomp!](https://www.google.co.jp/search?q=Chain+Chomp&tbm=isch)