var moment = require('moment-timezone');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
const db_utils = require('./db_utils.js');

var express = require('express');
var exphbs  = require('express-handlebars');

const cookieParser = require("cookie-parser");
var app = express();
app.use(cookieParser());

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

function getTimestampsForChannel(channel, callback) {
  var all_timestamps = [];
  db_utils.getChannelMessages(db, channel, (rows) => {
    rows.forEach(function(row) {
        all_timestamps.push(row["timestamp"]);
    });
    callback(all_timestamps);
  }, "timestamp");
}

function bucketTimestampsIntoDays(timestamps, timezoneString) {
  // List of timestamps -> converts to a {day: count} mapping (day in YYYY-MM-DD format)
  var dayMessageCount = {};
  timestamps.forEach(function(timestamp_sec) {
    var day = moment.tz(timestamp_sec * 1000, timezoneString).format("YYYY-MM-DD");
    if (!dayMessageCount[day]) {
      dayMessageCount[day] = 0;
    }
    dayMessageCount[day] += 1;
  });
  return dayMessageCount;
}

// Returns the [lower, upper] bounds (in timestamps)
// `day` is is 2019-07-26 format and `timezoneString` is in America/NewYork format
function getTimestampBounds(day, timezoneString) {
  var datetimeStart = moment.tz(day, timezoneString).startOf('day');
  var datetimeEnd = datetimeStart.clone().endOf('day');
  var lowerBound = datetimeStart.unix();
  var upperBound = datetimeEnd.unix();
  return [lowerBound * 1000, upperBound * 1000];
}

function handleChannel(req, res) {
  var channel = req.params['channel'];
  // Check for timezone cookie
  if (!req.cookies || req.cookies.timezonestring == undefined) {
    // KEEP THIS SCRIPT AS SIMPLE AS POSSIBLE.
    res.send(`Redirecting, please wait...
              <script>
                document.cookie='timezonestring=' + Intl.DateTimeFormat().resolvedOptions().timeZone;
                location.reload();
              </script>`);
    return;
  }
  // Send the message counts back to the server - {day: message count} mapping.
  getTimestampsForChannel(channel, function(all_timestamps) {
    var template = {};
    var timezoneString = req.cookies.timezonestring;
    // Use the timezone to figure out the days that chat messages were sent.
    var dayMessageCount = bucketTimestampsIntoDays(all_timestamps, timezoneString) 
    template.dayMessageCount = dayMessageCount;
    res.send(`timezoneString: ${timezoneString}, dayMessageCount: ${JSON.stringify(dayMessageCount)}`);
    return;
    res.render('template-channel', template);
  });
}

function handleChannelWithDay(req, res) {
  var day = req.params['day'];
  var timezoneString = req.cookies.timezonestring;
  var beginTimestamp, endTimestamp;
  [beginTimestamp, endTimestamp] = getTimestampBounds(day, timezoneString);
  var channel = req.params['channel'];
  console.log(`begin ${beginTimestamp}`);
  console.log(`end ${endTimestamp}`);
  // res.send(`Hello Channel ${channel} on day ${day}; begin ${beginTimestamp} end ${endTimestamp}`);
  db_utils.getChannelMessages(db, channel, (rows) => {
      var template = {}
      template["messages"] = rows;
      res.send(`here are all the ${rows.length} chat messages for #${channel} on ${day}: ${JSON.stringify(rows)}`);
  }, /*select_clause=*/null, beginTimestamp, endTimestamp);
}

app.get('/', handleIndex);
// thanks https://discuss.dev.twitch.tv/t/twitch-channel-name-regex/3855/2
app.get('/:channel([a-zA-Z0-9]{4,})/', handleChannel);
app.get('/:channel([a-zA-Z0-9]{4,})/:day(\\d{4}-\\d{2}-\\d{2})/', handleChannelWithDay);

app.listen(3000, function () {
  console.log('Example app listening on port 3000! :)');
});

