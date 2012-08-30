# Twitter Gardenhose
This node.js script saves the 1% of the twitter firehose to S3.  It can be run locally or as a heroku app.

## Setup

You will need Twitter API Keys, and AWS API Keys. Gather them first.

### Twitter API Keys

* go to [https://dev.twitter.com/apps](https://dev.twitter.com/apps)
* create an application, providing name, description, and a website (even if it is just a placeholder)
* Go to the bottom of the page and click "Create my access token"
* Copy your
    * Consumer key
    * Consumer secret
    * Access Token
    * Access Token secret

### AWS API Keys
* Log in to your [AWS console](https://console.aws.amazon.com/s3/home?#)
* Create a new bucket, make a note of the name
* Get your [security credentials](https://portal.aws.amazon.com/gp/aws/securityCredentials)
* Copy your 
    * Access Key ID
    * Secret Access Key

## Running Locally

For local usage, this README assumes Mac OS X, though steps should be similar for other operating systems.

### Install node and required packages

Make sure node.js is installed.

`brew install node`

Make sure you have all of the required packages:

`npm install`

inside of the folder. This will automatically detect and read from the
packages.json file. To learn more about the package.json file, see
[http://npmjs.org/doc/json.html](http://npmjs.org/doc/json.html)

### Set API keys in your environment

Create a copy of the template .env file:

`cp .env.example .env`

Edit .env, putting the values you just gathered from Twitter and AWS in place of the placeholders denoted with <<>>

### Dry run

Once all of the packages are installed, try a dry run which won't write to S3:

    source .env
    node main.js -dv

If your API keys and environment are set up correctly, many tweets will fly past your console. Control-C to kill the process.

### Real run

If you want to actually write to S3, run:

    source .env
    node main.js

## Running on Heroku

Once you are satisfied that everything is set up correctly, you probably want to run the Gardenhose on a PaaS which will have faster upload to S3 and will keep running even when you shut down your local machine. This README assumes you have a [heroku](http://heroku.com) account, and have installed the [heroku toolbelt](https://toolbelt.heroku.com).

### To deploy the app to heroku:
1. `heroku create twitter-gardenhose`
2. `git push heroku master` - Pushes and deploys the app
3. Set heroku configuration

        heroku config:add TWITTER_CONSUMER_KEY=<<Your twitter consumer key>>
        heroku config:add TWITTER_CONSUMER_SECRET=<<Your twitter consumer secret>>
        heroku config:add TWITTER_ACCESS_TOKEN_KEY=<<Your twitter access token key>>
        heroku config:add TWITTER_ACCESS_TOKEN_SECRET=<<Your twitter access token secret>>
        heroku config:add AWS_ACCESS_KEY_ID=<<Your AWS access key ID>>
        heroku config:add AWS_SECRET_ACCESS_KEY=<<Your AWS secret access key>>
        heroku config:add AWS_S3_BUCKET_NAME=<<Your AWS S3 bucket name to store tweets>>
            
### Start a worker on heroku

`heroku ps:scale worker=1` - Starts the worker and begins storing tweets.

### Stop the worker on heroku

`heroku ps:scale worker=0` - Shuts down the worker.

Note, you should not have more than one worker going. Doing so will cause
duplication in the tweets that are stored on S3

### Monitoring status
To monitor the worker, run:

`heroku logs --tail`

This will show you the current status of the gardenhose.

## How it Works

The twitter_gardenhose app sucks down tweets, and writes a new file every time it's buffer reaches 20MB.  Each individual file is named by unix timestamp it was created.

Raw tweets are stored as JSON, one object per tweet.  In addition to the text of the tweet, the JSON object contains lots of metadata about the tweet (the media, the user, retweet info, geolocation, etc).

## Filtering Tweets

What if you wanted to limit the gardenhose to tweets with location tags in the continental US?

Change the call to twit.stream to read:

`twit.stream('statuses/filter', {locations:'-128,24,-64,52'}, function(stream) {...};`

See [Twitter's Streaming APIs](https://dev.twitter.com/docs/streaming-apis) for more.