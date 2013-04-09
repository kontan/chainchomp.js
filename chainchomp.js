
/** 
 * Invoke untrusted guest code in a sandbox.
 * The guest code can access objects of the standard library of ECMAScript.
 *
 * function chainchomp(script: string, scope?: any = {}, options?: { enableEval?: bool } = {}): any;
 *
 * @param script guest code.
 * @param scope an object whose properties will be exposed to the guest code. 
 * @param options options object. If a "enableEval" property is true, the guest code can get the global object and the host code will be exposed to risk.
 * @return result of the process.
 */
function chainchomp(script, scope, options){
    // First, you need to pile a picket to tie a Chain Chomp.
    // If the environment is changed, the picket will drop out.
    // You should remake a new picket each time as long as　you are so busy.
    // ------------------------------------------------------------------
    // If the global object is changed, you must remake a picket.
    var picket = chainchomp.pick();

    // Next, get new Chain Chomp tied the picket. 
    // Different Chain Chomps have different behavior.
    // --------------------------------------------------------------
    // If you need a different function, you can get another one. 
    var chomp = picket(script, scope, options);

    // Last, feed the chomp and let it rampage! 
    // A chomp eats nothing but　a kind of feed that the chomp ate at first.  
    // ----------------------------------------------------------------------
    // If only scope is changed, you need not to remake the Chain Chomp and the picket.
    return chomp(scope);
}

chainchomp.pick = (function(){
    // Dynamic instantiation idiom
    // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
    function construct(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    }

    function getBannedVars(){
        // correct banned object names.
        var banned = ['__proto__', 'prototype'];
        function ban(k){
            if(banned.indexOf(k) < 0 && k !== 'eval' && k.match(/^[_$a-zA-Z][_$a-zA-Z0-9]*$/)){
                banned.push(k);
            }
        }
        var global = new Function("return this")();
        Object.getOwnPropertyNames(global).forEach(ban);
        for(var k in global){
            ban(k);
        }

        // ban all ids of the elements
        function traverse(elem){
            var id = elem.getAttribute && elem.getAttribute('id');
            if(id){
                ban(id);
            }
            var childs = elem.childNodes;
            for(var i = 0; i < childs.length; i++){
                traverse(childs[i]);
            }
        }    
        traverse(document);

        return banned;
    }

    function invokeSandboxedFunction(f, values, options){
        // evacuate properties of Function.__proto__
        // Function.__proto__ === Function.prototype ??
        var evacuatedProperties = {};
        evacuatedProperties.proto = Function.__proto__.__proto__;
        Function.__proto__.__proto__ = undefined;      // Function.__proto__.__proto__ was freezed?
        Object.getOwnPropertyNames(Function.__proto__).forEach(function(k){
            evacuatedProperties[k] = Function.__proto__[k];
            Function.__proto__[k] = undefined;
        });

        // ISSUE:     
        //     Function.__proto__.toString = undefined
        // cause a crush in Chrome
        Function.__proto__.toString    = function(){ return ""; };

        // Function.apply enabling　hack
        f.apply    = evacuatedProperties['apply'];
        f.toString = evacuatedProperties['toString'];

        // evacuate eval
        var _eval = eval;
        
        // ban eval ////////////////////////////////////////////////////////////////////////////////////////////////////
        // eval is fatal security hole for this library and it must be banned.
        // However, In Chrome, replacing eval prevents watching expression in Dev tools.
        // You should make eval enable only when you are debugging this library or your own guest codes.  
        if( ! options.enableEval){
           eval = undefined;
        }

        // invoke sandboxed function ///////////////////////////////////////////////////////////////////////////////////

        // call the sandboxed function
        try{
            return f.apply(undefined, values);
        }finally{

            // postprocess /////////////////////////////////////////////////////////////////////////////////////////////

            // restore eval
            eval = _eval;

            // restore properties of Function.__proto__
            Object.getOwnPropertyNames(Function.__proto__).forEach(function(k){ 
                Function.__proto__[k] = evacuatedProperties[k];
            });  
            Function.__proto__.__proto__ = evacuatedProperties.proto;
        }
    }

    // table of exposed objects
    function getStdlibs(){
        return {
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
    }

    // freeze exposed objects
    var stdlibs = getStdlibs();
    function freeze(v){
        if(v && (typeof v === 'object' || typeof v === 'function')){
            Object.freeze(v);
            freeze(v.prototype);
            if(typeof v !== 'function' && v.__proto__) freeze(v.__proto__);
        }        
    }
    Object.getOwnPropertyNames(stdlibs).forEach(function(k, i){
        freeze(stdlibs[k]);
    });
    Object.freeze(Function.__proto__.__proto__);

    function createSnadboxedFunction(script, exposed, banned){
        var args = Object.keys(exposed).concat(banned.filter(function(b){ return ! (b in exposed); }));
        args.push('"use strict";\n' + script);
        return construct(Function, args);        
    }

    return function(){

        var banned = getBannedVars();
        
        return function(script, scope, options){ 
            // validate arguments
            if( ! (typeof script === 'string' || script instanceof String )){
                throw new TypeError();
            }

            // store default values of the parameter
            scope = scope || {};
            options = options || {};

            // Expose custom properties 
            var exposed = getStdlibs();
            Object.keys(scope).forEach(function(k){
                exposed[k] = scope[k];
            });

            // create sandboxed function
            var f = createSnadboxedFunction(script, exposed, banned);      
            
            return function(scope){
                scope = scope || {};
                var args = Object.keys(exposed);
                var values = [];
                for(var i = 0; i < args.length; i++){
                    var key = args[i];
                    values.push(key in scope ? scope[key] : exposed[key]);
                }    
                return invokeSandboxedFunction(f, values, options);
            };
        };
    };
})();