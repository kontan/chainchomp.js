

                    function fizzbuzz(i) { return ((i % 3 ? '' : 'Fizz') + (i %  5 ? '' : 'Buzz') || i); }
var fizzbuzz_str = "function fizzbuzz(i) { return ((i % 3 ? '' : 'Fizz') + (i %  5 ? '' : 'Buzz') || i); }";


function test(f){
	var COUNT = 1000;
	var result = "";
	var start = performance.now();
	for(var i = 0; i < COUNT; i++){
		result += f(i);
	}
	return (performance.now() - start).toFixed(2);
}

var COUNT = 10000;

// direct
$("#direct").text(function test(f){
	var start = performance.now();
	for(var i = 0; i < COUNT; i++){
		console.log(fizzbuzz(i));
	}
	return (performance.now() - start).toFixed(2);
});

// chainchomp
$("#chainchomp").text(function test(f){
	var start = performance.now();
	var picket = chainchomp.pick();
	var scope = { i: undefined };
	var chomp = picket(fizzbuzz_str, scope);
	for(var i = 0; i < COUNT; i++){
		scope.i = i;
		console.log(chomp(scope));
	}
	return (performance.now() - start).toFixed(2);
});