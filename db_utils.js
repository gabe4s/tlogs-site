
function getChannelMessages(db, channelName, callback, select_clause, timestamp_ms_beginning, timestamp_ms_end) {
  if (!select_clause) {
    select_clause = "*";
  }
  var where_clause = `channelId = (select id from channel where channel.name="${channelName}")`;
  if (timestamp_ms_beginning != undefined && timestamp_ms_end != undefined) {
    where_clause += ` and timestamp > ${timestamp_ms_beginning / 1000}`;
    where_clause += ` and timestamp < ${timestamp_ms_end / 1000}`;
  }
  db.serialize(function() {
    db.all(`SELECT ${select_clause} from message WHERE ${where_clause};`, [], (err, rows) => {
      if (err) {
        console.log("Error selecting messages from channel:");
        console.log(err);
        return false;
      } else {
        callback(rows);
      }
    });
  });
}

function insertMessageIntoChannel(db, text, channelName, sender, emotes, timestamp_ms, color) {
  db.serialize(function () {
    var timestamp_seconds = timestamp_ms / 1000; // SQLITE does time as seconds
    // Channel names are unique, so inserting will cause an error.
    // If we catch an error, ignore it!
    db.run(`INSERT OR IGNORE INTO channel(name) VALUES("${channelName}")`)
      .run(`INSERT INTO message (text, channelId, sender, emotes, timestamp, color)
            VALUES (?, (select id from channel where channel.name="${channelName}"), ?, ?, ?, ?)`,
            [text, sender, emotes, timestamp_seconds, color]);
    console.log(`#${channelName} | ${sender}: ${text}`);
  });
};

module.exports = {
  insertMessageIntoChannel: insertMessageIntoChannel,
  getChannelMessages: getChannelMessages
}

