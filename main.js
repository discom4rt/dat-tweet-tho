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
var knox = require('knox');        // S3 API wrapper: https://github.com/LearnBoost/knox
var opts = require('commander');   // Parse command line arguments
opts
    .version('0.0.1')
    .option('-v, --verbose', 'log every tweet to console')
    .option('-d, --dryrun', 'do not write to S3')
    .parse(process.argv);

var current_stream = undefined          // WriteStream of tweets
var INTERVAL_MS__STREAM_CHECK = 1000;   // Number of milliseconds to wait between checking the stream size (1 second)
var BYTE_SIZE__NEW_FILE_CUT = 20000000; // Bytes of tweets to accumulate before writing a file to S3 (20MB)
var file_name = "";                     // Name of file to write to S3
var to_exit = false;                    // Set to true on SIGINT -- for graceful shutdown

// Initialize Twitter API keys
var twit = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Initialize S3 API keys
var s3 = knox.createClient({
    key: process.env.AWS_ACCESS_KEY_ID, 
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET_NAME
})

// Open up the initial file handler.
newWriteStream();

// Check the state of the file every second
setInterval(function(){
  fs.stat(file_name, function(err, stats){
    if (stats.size > BYTE_SIZE__NEW_FILE_CUT) {
      newWriteStream();
    }
  });
},INTERVAL_MS__STREAM_CHECK);

twit.stream('statuses/sample', {}, function(stream) {
  stream.on('data', function(data) {
    if(opts.verbose) {
        console.log("loc: "+JSON.stringify(data.place)+" : "+data.text);
    }

    if ((! opts.dryrun) && current_stream.writable) {
       current_stream.write(JSON.stringify(data)+"\n");
    }
  });
});

function newWriteStream() {
  // Close out the existing file first!
  closeCurrentStream();

  // Reassign current file to a new file
  file_name = new Date().getTime();
  file_name = file_name.toString() + '.json';
  console.log("============ Cutting a new stream:", file_name);
  stream = fs.createWriteStream(file_name);
  current_stream = stream;
}

function closeCurrentStream() {
  if (current_stream) {
    current_stream.destroySoon();

    upload_name = file_name;
    current_stream.on("close", function(){
      console.log("^^^^^^^^^^^^ Uploading "+upload_name);
      fs.readFile(upload_name, function(err, buf){
        if (err) throw err;

        var req = s3.put('tweets/'+upload_name, {
            'Content-Length': buf.length
          , 'Content-Type': 'text/plain'
        });

        req.on('response', function(res){
          if (200 == res.statusCode) {
            console.log('>>>>>>>>>> Saved to %s', req.url);
            fs.unlinkSync(upload_name);
            if (to_exit) {
              process.exit();
            }
          }
          else {
            console.log('Error uploading! Status code:' + res.statusCode);
          }
        });
        req.end(buf);
      });
    });
  }
}

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