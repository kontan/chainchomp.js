function fizzbuzz(i) { return ((i % 3 ? '' : 'Fizz') + (i %  5 ? '' : 'Buzz') || i); }
   var fizzbuzz_str = "return ((i % 3 ? '' : 'Fizz') + (i %  5 ? '' : 'Buzz') || i);";

var COUNT = 10000;

function test(id, f){
	var start = performance.now();
	f();
	$("#" + id).text((performance.now() - start).toFixed(2));	
}

// direct
test("direct", function(){
	for(var i = 0; i < COUNT; i++){
		console.log(fizzbuzz(i));
	}
});

// chainchomp
test("chainchomp", function(){
	var picket = chainchomp.pick();
	var scope = { i: true };
	var chomp = picket(fizzbuzz_str, scope);
	for(var i = 0; i < COUNT; i++){
		scope.i = i;
		console.log(chomp());
	}
});