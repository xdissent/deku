
function subscribe(world, input, send){
  var time = input.time;
  var interval = setTimeout(function(){
    send(time);
  });

  function unsubscribe() {
    clearInterval(interval);
  }

  return interval;
}
