# Twitter Gardenhose
This simple node.js script saves the 1% of the twitter firehose that is public to S3.

## How to Use
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

## How to use locally
### Set API keys in your environment
This README assumes Mac OS X.

`cp .env.example .env`

Put the values you just gathered from Twitter and AWS in place of the placeholders denoted with <<>>

`source .env`

Make sure node.js is installed.

`brew install node`

Make sure you have all of the required packages. Simply run:

`npm install`

inside of the folder. This will automatically detect and read from the
packages.json file. To learn more about the package.json file, see
[http://npmjs.org/doc/json.html](http://npmjs.org/doc/json.html)

Once all of the packages are installed, try a dry run which won't write to S3:

`node main.js -dv`

And if your API keys and environment are set up correctly, many tweets will fly past your console. Control-C to kill the process.

If you want to actually write to S3 run
`node main.js`

## How to use from Heroku
Once you are satisfied that everything is set up correctly, you probably want to run the Gardenhose on a PaaS which will have faster upload to S3 and will keep running even when you shut down your local machine. This README assumes you have a [heroku](http://heroku.com) account, and have installed the [heroku toolbelt](https://toolbelt.heroku.com).

### To deploy the app to heroku:
1. `heroku create twitter-gardenhose`
2. `git push heroku master` - Pushes and deploys the app
3. Make sure you have the heroku toolbelt installed. If not, go to https://toolbelt.heroku.com/
4. `heroku ps:scale worker=1` - Starts the worker and begins mining
tweets.
5. `heroku ps:scale worker=0` - Shuts down the worker.

Note, you should not have more than one worker going. Doing so will cause
duplication in the tweets that are stored on S3

### To monitor the status
Assuming you have the [heroku toolbelt](https://toolbelt.heroku.com) installed
simply run the command:

`heroku logs --tail`

This will show you the current status of the twitter streaming.

## How it Works
The remarkable power of Node.js makes this app somewhat trivial.

The Twitter library for node sets up an object with the authentication
credentials of any Twitter app. You then connect it to a twitter stream. To
see the types of stream available and the parameters those streams take,
go to https://dev.twitter.com/docs/streaming-apis

Node.js is event-based. That means that a function will get called every
time an 'event' happens. We have a function that is bound to the 'data'
event of the twitter stream that will write that tweet to a file.

Since tweets come in so rapidly, we use a filestream object instead of a
plain file object. The difference between the two is documented here:
http://nodejs.org/api/fs.html

When a file reaches a certain size (currently arbitrarily 20MB), the file
will be closed, a new one created, and the full one uploaded to amazon's
S3. We use a library called [Knox](https://github.com/LearnBoost/knox/) to
super easily upload stuff to S3 buckets.

The uploading and closing of a file happens in the closeCurrentStream()
method.

We didn't want a file that was too small, otherwise we'd get hundreds of
thousands of small files on S3. That's inefficent. We didn't want a single
file that was too big because we don't want to lose all of our tweets
in case something bad happens to that file.

## Data output
Each individual file is named by unix timestamp it was created.

We dump raw tweets into JSON compatible text files.

The JSON for a tweet is way, way more than 140 characters. It contains
information for the tweet, the media, the user, retweet info, geolocation,
and a bunch of other stuff.

## Filtering Tweets
What if you wanted to limit the gardenhose to tweets with location tags in the continental US?

Change the call to twit.stream to read:

`twit.stream('statuses/filter', {locations:'-128,24,-64,52'}, function(stream) {...};`

See [Twitter's Streaming APIs](https://dev.twitter.com/docs/streaming-apis) for more.