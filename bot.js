
const loadJsonFile = require('load-json-file');
const tmi = require('tmi.js');
var sqlite3 = require('sqlite3').verbose();
const db_utils = require('./db_utils.js');

function loadTwitchData(db, channels) {
    var passwords = loadJsonFile.sync('passwords.json');
    var opts = {
      identity: {
        username: passwords['username'],
        password: passwords['oath_token']
      },
      channels: channels
    };
    // Create a client with our options
    const client = new tmi.client(opts);

    // Called every time the bot connects to Twitch chat
    function onConnectedHandler (addr, port) {
      console.log(`* Connected to ${addr}:${port}`);
    }

    function onMessageHandler (target, context, msg, self) {
      if (self) { return; } // Ignore messages from the bot

      const text = msg.trim();

      // Channel names (stored in `target`) start with # - strip the #
      var channelName = "";
      if (target.length > 0 && target[0] == '#') {
        channelName = target.substring(1);
      } else {
        channelName = target;
      }
      var color = context["color"];
      var sender = context["display-name"];
      var emotes = context["emotes-raw"];
      var timestamp_ms = context["tmi-sent-ts"];

      db_utils.insertMessageIntoChannel(db, text, channelName, sender, emotes, timestamp_ms, color);
    }

    // Register our event handlers (defined below)
    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);

    return client;
}

var channels = ['popcorncolonel', 'monotonetim', 'stereotonetim'];

function startBot(db) {
  // Connect to Twitch
  var client = loadTwitchData(db, channels);
  client.connect();
}

var db = new sqlite3.Database('./messages.sqlite', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to messages database.");
});
console.log(db_utils.getChannelMessages(db, "monotonetim", (rows) => { console.log(rows); console.log(rows.length); }, 1562522455000, 1562523455000));

startBot(db);

