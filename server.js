var express    = require('express');
var bodyParser = require('body-parser');
var request    = require('request');
var yaml       = require('node-yaml-config');
var q          = require('q');
var _          = require('underscore');

var app        = express();
var port       = process.env.PORT || 9000;
var url        = process.env.URL || 'http://localhost';
var config     = yaml.load('config.yml');

var getRandomGIF = function() {
  var deferred = q.defer();
  var url = 'https://fatchicken007.github.io/make-it-rain/gifs.json';

  request.get(url, {json: true}, function(err,response,body) {
    var r = _.random(0,body.length-1);
    deferred.resolve(body[r]);
  });

  return deferred.promise;
};

var postToSlack = function(amount, gif) {
  var deferred = q.defer();
  var options = {
    url: config.slack,
    method: 'POST',
    body: {
      username: 'Just got paid',
      icon_emoji: ':heavy_dollar_sign:',
      text: amount + ' - ' + gif,
      unfurl_links: true
    },
    json: true
  };

  request(options, function(err, response, body) {
    deferred.resolve(body);
  });

  return deferred.promise;
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/celery', function(req,res,next) {
  var body = req.body || {};

  if (body.type === 'order.charge.succeeded') {
    var amount = '$' + body.data.paid/100;

    getRandomGIF().then(function(gif) {
      return postToSlack(amount, gif);
    }).then(function() {
      res.send('Got paid!');
    });
  } else {
    res.send('Didn\'t get paid :(');
  }
});

var server = app.listen(port);

console.log('Listening on ' + url + ':' + port);
