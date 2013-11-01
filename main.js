//
// Licensed to Mortar Data Inc. (Mortar) under one or more contributor license agreements.  
// See the NOTICE file distributed with this work for additional information regarding copyright ownership.
// Mortar licenses this file to you under the Apache License, Version 2.0 (the "License"); 
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and limitations under the License.
//       
       
var fs = require('fs');            // node file system api
var twitter = require('twitter');  // Twitter API wrapper: https://github.com/jdub/node-twitter
var opts = require('commander');   // Parse command line arguments
opts
    .version('0.0.1')
    .option('-v, --verbose', 'log every tweet to console')
    .parse(process.argv);

var TWEET_INTERVAL = 2000;              // The amount of tweets that must be tweeted before one gets fucked
var to_exit = false;                    // Set to true on SIGINT -- for graceful shutdown
var count = 0;                          // The number of tweets that have been seen
var symbols = ['#'];

// Initialize Twitter API keys
var twit = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

twit.verifyCredentials(function(data) {
  console.log("cred: "+JSON.stringify(data));
});


twit.stream('statuses/sample', {}, function(stream) {
  stream.on('data', function(data) {

      count++;
      process.stdout.write(count + "\r");
      if( count >= TWEET_INTERVAL && data.text ) {
        fuckThatTweetUp( data.text );
        count = 0;
      }

      // console.log("loc: "+JSON.stringify(data.place)+" : "+data.text);
  });
});

function fuckThatTweetUp( tweet ) {
  var newTweet = [],
    splitTweet,
    word,
    randomIndex,
    symbolIndex,
    symbol;

  tweet = tweet.replace(/RT|\"|\'/g, '').replace(/^\s+|\s+$/g, '');
  splitTweet = tweet.split(/\s+/);

  while(splitTweet.length) {
    randomIndex = Math.floor(Math.random() * splitTweet.length);
    word = splitTweet.splice(randomIndex, 1);

    if( !/^http|^#/.test(word) ) {
      // A "50%" chance to throw in a symbol
      symbolIndex = Math.floor(Math.random() * symbols.length * 2);
      symbol = symbols[symbolIndex] || '';
      word = word.toString().replace(/^@/, '+');
      newTweet.push(symbol + word);
    } else {
      newTweet.push(word);
    }
  }

  twit.updateStatus(newTweet.join(' '), function(data) {
      console.log('test: ' + JSON.stringify(data));
    }
  );
}

// both can be undefined
// theres "RT" in some
// consider randomly combining words
// looks like its still safe to split by space
// preserve URLS
// remove quotes

process.on('SIGINT', function(){
  to_exit = true;
  closeCurrentStream();
});

process.on('exit', function(){
  console.log("ABOUT TO EXIT!");
});


function handleError(err,objects) {
  if (err) console.warn(err.message);
  if (err && err.message.indexOf('E11000 ') !== -1) {
    // this _id was already inserted in the database
  }
}