const WEATHER_CHECK_INTERVAL_MS = 1000 * 60 * 5;
const CITY = 'Westerville, OH';
const RED_PIN = 9;
const GREEN_PIN = 6;
const BLUE_PIN = 5;

const noaaWeather = require('noaa-weather');
const five = require("johnny-five");

let WG = {};

WG.App = function() {

  let board, led, weather;

  function start() {
    board = new five.Board()
    board.on("ready", onBoardReady);
  }

  function onBoardReady() {

    led = new WG.Led();
    weather = new WG.Weather();

    this.repl.inject({
      led: led,
      weather: weather
    });

    updateWeather();
    setInterval(updateWeather, WEATHER_CHECK_INTERVAL_MS);

  };

  function updateWeather() {
    weather.fetchWeather(CITY)
      .then(data => {
        console.log(`${new Date()} Temperature: ${data.temperature} Change of Precipitation: ${data.chanceOfPrecipitation}`);
        led.applyTemperatureAndPrecipitation(data.temperature, data.chanceOfPrecipitation);
      });
  }

  this.start = start;

};

WG.Weather = function() {

  function fetchWeather(city) {
    return noaaWeather(city).then(result => {
      return {
        temperature: parseInt(result.data.temperature[0], 10),
        chanceOfPrecipitation: parseInt(result.data.pop[0] || 0)
      }
    });
  }

  this.fetchWeather = fetchWeather;

};

WG.Led = function() {

  let leds = five.Leds([RED_PIN, GREEN_PIN, BLUE_PIN]);

  let red = leds[0];
  let green = leds[1];
  let blue = leds[2];

  function applyTemperatureAndPrecipitation(temperature, chanceOfPrecipitation) {
    if (chanceOfPrecipitation === 0) {
      displayWithoutPrecipitation(blueBrightness(temperature), redBrightness(temperature));
    } else {
      displayWithPrecipitation(blueBrightness(temperature), redBrightness(temperature), pulseRate(chanceOfPrecipitation));
    }
  }

  function displayWithoutPrecipitation(blueBrightness, redBrightness) {
    leds.stop();
    blue.fade(blueBrightness, 1000);
    red.fade(redBrightness, 1000);
  }

  function displayWithPrecipitation(blueBrightness, redBrightness, pulseRate) {
    leds.pulse({
      target: leds,
      duration: pulseRate,
      keyFrames: [
        [0, redBrightness], [0, 0], [0, blueBrightness]
      ]
    });
  }

  function blueBrightness(temperature) {
    return (60 - Math.min(clippedTemperature(temperature), 60)) / 40 * 255;
  }

  function redBrightness(temperature) {
    return (Math.max(clippedTemperature(temperature), 40) - 40) / 40 * 255;
  }

  function clippedTemperature(temperature) {
    return Math.min(80, Math.max(temperature, 20));
  }

  function pulseRate(chanceOfPrecipitation) {
    return (100 - chanceOfPrecipitation) / 100 * 2500 + 500;
  }

  this.applyTemperatureAndPrecipitation = applyTemperatureAndPrecipitation;

};


let app = new WG.App();
app.start();
