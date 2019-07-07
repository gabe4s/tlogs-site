var path = require('path');
var sqlite3 = require('sqlite3').verbose();
const db_utils = require('./db_utils.js');

var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();

app.engine(".html", exphbs({extname: ".html"}));
app.set("view engine", ".html");
app.set("views", path.join(__dirname, "/public/html/"));
app.use(express.static("public"));

app.locals.layout = false;

var db = new sqlite3.Database('./messages.sqlite', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to messages database.");
});

function handleIndex(req, res) {
  res.render('home');
}

function handleChannel(req, res) {
  var testObject = {};
  testObject.days = ["2019-07-07", "2019-07-12"]
  res.render('template-channel', testObject);
}

function handleChannelWithDay(req, res) {
  var channel = req.params['channel'];
  var day = req.params['day'];
  // res.send(`Hello Channel ${channel} on day ${day}`);
  var all_messages = [];
  db_utils.getChannelMessages(db, channel, (rows) => {
      all_messages = rows;
      res.send(`here are all the chat messages for #${channel}: ${JSON.stringify(all_messages)}`);
  });
}

app.get('/', handleIndex);
// thanks https://discuss.dev.twitch.tv/t/twitch-channel-name-regex/3855/2
app.get('/:channel([a-zA-Z0-9]{4,})/', handleChannel);
app.get('/:channel([a-zA-Z0-9]{4,})/:day(\\d{4}-\\d{2}-\\d{2})/', handleChannelWithDay);

app.listen(3000, function () {
  console.log('Example app listening on port 3000! :)');
});

