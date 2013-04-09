Lightweight JavaScript Sandbox
---------------------------------------------

**This project is experimental. Some vulnerability may be found and abort the project.**

## Usage

To use chainchomp.js, add the following element to your html code:

    <script src="https://raw.github.com/kontan/chainchomp.js/master/chainchomp.js"></script>

Now chainchomp.js provides only one function is provided:

    function chainchomp(script: string, scope?: any, options?: any): any;

## Example

    console.log(chainchomp('return 1 + 2'));    // prints "3"

    console.log(chainchomp('window.location = "http://example.com/"'));    // TypeError

    chainchomp('puts("Hello, World!")", { puts: function(s){ console.log(s); } });    // prints "Hello, World!"

## Restriction

* ***Some basic objects, such as `String`, `Number` and `Boolean` are freezed***. (`Object.freeze`) It may influences all your codes after `chainchomp` called.
* `eval` and `Function` are banned. ( `eval === undefined && Function === undefined` )
* All guest code runs under Strict mode. 