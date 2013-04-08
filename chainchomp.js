/**
 * function chainchomp(script: string, scope?: any = {}, options?: { enableEval?: bool } = {}): any;
 * 
 * Invoke untrusted guest code in a sandbox.
 * The guest code can access objects of the standard library of ECMAScript.
 *
 * ## Restrictions
 *
 * * Some objects are banned: eval, Function.
 * * Strict mode only. All guest code are run under the strict mode automatically.
 *
 * @param script guest code.
 * @param scope an object whose properties will be exposed to the guest code. 
 * @param options options object. If a "enableEval" property is true, the guest code can get the global object and the host code will be exposed to risk.    
 */
function chainchomp(script, scope, options){
    // Dynamic instantiation idiom
    // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
    function construct(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    }

    // validate arguments
    if( ! (typeof script === 'string' || script instanceof String )){
        throw new TypeError();
    }

    // store default values of the parameter
    scope = scope || {};
    options = options || {};

    // evacuate eval
    var _eval = eval;
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ban eval ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // eval is fatal security hole for this library and it must be banned.
    // However, In Chrome, replacing eval prevents watching expression.
    // You should make eval enable only when you are debugging this library.  
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    if( ! options.enableEval){
        eval = undefined;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // table of arguments and values
    var exposed = {
        'Object'            : Object,
        'String'            : String,
        'Number'            : Number,
        'Boolean'           : Boolean,
        'Array'             : Array,
        'Date'              : Date,
        'Math'              : Math,
        'RegExp'            : RegExp,
        'Error'             : Error,
        'EvalError'         : EvalError,
        'RangeError'        : RangeError,
        'ReferenceError'    : ReferenceError,
        'SyntaxError'       : SyntaxError,
        'TypeError'         : TypeError,
        'URIError'          : URIError,
        'JSON'              : JSON,
        'NaN'               : NaN,
        'Infinity'          : Infinity,
        'undefined'         : undefined,
        'parseInt'          : parseInt,
        'parseFloat'        : parseFloat,
        'isNaN'             : isNaN,
        'isFinite'          : isFinite,
        'decodeURI'         : decodeURI,
        'decodeURIComponent': decodeURIComponent,
        'encodeURI'         : encodeURI,
        'encodeURIComponent': encodeURIComponent
    };

    // Expose custom properties 
    Object.keys(scope).forEach(function(k){
        exposed[k] = scope[k];
    });

    // correct banned object names.
    var banned = ['__proto__', 'prototype'];
    function ban(k){
        if(banned.indexOf(k) < 0 && k !== 'eval' && k.match(/^[_$a-zA-Z][_$a-zA-Z0-9]*$/) && ! (k in exposed)){
            banned.push(k);
        }
    }
    var global = new Function("return this")();
    Object.getOwnPropertyNames(global).forEach(ban);
    for(var k in global){
        ban(k);
    }    

    // create sandboxed function
    var args = Object.keys(exposed);
    var values = [];
    for(var i = 0; i < args.length; i++){
        values.push(exposed[args[i]]);
    }
    args = args.concat(banned);
    args.push('"use strict";\n' + script);
    var f = construct(Function, args);

    // call the sandboxed function
    try{
        // 足りなかった引数は undefined になるので、value を減らせる？
        return f.apply(undefined, values);
    }finally{
        if( ! options.enableEval){
            eval = _eval;
        }
    }
}