var twitter = require('twitter'),   // Twitter API wrapper: https://github.com/jdub/node-twitter
  opts = require('commander');      // Parse command line arguments

opts.version('0.0.1')
    .option('-v, --verbose', 'Log some debug info to the console')
    .parse(process.argv);

var TWEET_INTERVAL = 100000,  // The amount of tweets that must be tweeted before one gets fucked
  count = 0;                  // The number of tweets that have been seen

// Initialize Twitter API keys
var twit = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

twit.verifyCredentials(function(data) {
  if(opts.verbose) {
    console.log("creds: " + JSON.stringify(data));
  }
});

// Every TWEET_INTERVAL construct tweet a DAT <RANDOM WORD> THO
twit.stream('statuses/sample', {}, function(stream) {
  stream.on('data', function(data) {
    count++;

    if(opts.verbose) {
      process.stdout.write(count + "\r");
    }

    if( count >= TWEET_INTERVAL && data.text ) {
      makeDatTweet( data.text );
      count = 0;
    }
  });
});

// Construct a tweet with DAT <RANDOM WORD> THO
function makeDatTweet( tweet ) {
  var newTweet = ['DAT'],
    splitTweet,
    word,
    randomIndex,
    symbolIndex,
    symbol;

  tweet = tweet.replace(/RT|\"|\'|\:|@/g, '').replace(/^\s+|\s+$/g, '');
  splitTweet = tweet.split(/\s+/);

  while(splitTweet.length && !word) {
    randomIndex = Math.floor(Math.random() * splitTweet.length);
    word = splitTweet.splice(randomIndex, 1);

    if( /^http/.test(word) ) {
      word = null;
    } else {
      newTweet.push(word.toString().toUpperCase());
      newTweet.push('THO');
    }
  }

  twit.updateStatus(newTweet.join(' '), function(data) {
      if(opts.verbose) {
        console.log('tweet: ' + JSON.stringify(data));
      }
    }
  );
}

// Handle exit signals
process.on('SIGINT', function(){
  process.exit(1);
});

process.on('exit', function(){
  console.log("Exiting...");
});
