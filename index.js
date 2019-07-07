var express = require('express');
var app = express();

function handleIndex(req, res) {
  res.send('Hello World! :))-');
}

function handleChannel(req, res) {
  res.send('Hello Channel ' + req.params['channel'] + '! :))-');
}

app.get('/', handleIndex);
app.get('/:channel([a-zA-Z0-9]{4,})/', handleChannel); /* thanks https://discuss.dev.twitch.tv/t/twitch-channel-name-regex/3855/2 */

app.listen(3000, function () {
  console.log('Example app listening on port 3000! :)');
});

