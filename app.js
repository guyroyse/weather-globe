var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var led = new five.Led.RGB([ 9, 6, 5 ]);
  led.color('#ffffff');
  led.strobe(500);
});
