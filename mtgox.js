if (Meteor.isServer) {
	var require = Npm.require;
	var querystring = require('querystring'),
	        https = require('https'),
	        crypto = require('crypto');

	MtGoxClient = function(key, secret) {
		this.key = key;
		this.secret = secret;
	};

	MtGoxClient.prototype.query = function(path, args, callback) {
	        var client = this;

	        // if no args or invalid args provided, just reset the arg object
	        if (typeof args != "object") args = {};

	        // generate a nonce
	        args['nonce'] = (new Date()).getTime() * 1000;
	        // compute the post data
	        var post = querystring.stringify(args);
	        // compute the sha512 signature of the post data
	        var hmac = crypto.createHmac('sha512', new Buffer(client.secret, 'base64'));
	        hmac.update(post);

	        // this is our query
	        var options = {
	                host: 'data.mtgox.com',
	                port: 443,
	                path: '/api/' + path,
	                method: 'POST',
	                agent: false,
	                headers: {
	                        'Rest-Key': client.key,
	                        'Rest-Sign': hmac.digest('base64'),
	                        'User-Agent': 'Mozilla/4.0 (compatible; MtGox node.js client)',
	                        'Content-type': 'application/x-www-form-urlencoded',
	                        'Content-Length': post.length
	                }
	        };

	        // run the query, buffer the data and call the callback
	        var req = https.request(options, function(res) {
	                res.setEncoding('utf8');
	                var buffer = '';
	                res.on('data', function(data) { buffer += data; });
	                res.on('end', function() { if (typeof callback == "function") { callback(JSON.parse(buffer)); } });
	        });

	        // basic error management
	        req.on('error', function(e) {
	                console.log('warning: problem with request: ' + e.message);
	        });

	        // post the data
	        req.write(post);
	        req.end();
	};


	Meteor.startup(function() {
		/*
		Future = Npm.require('fibers/future');
		
		Meteor.methods({
			getFoo: function() {
				var future = new Future();
				setTimeout(function() {
					
				}, 3000);
				
				return future.wait();
			}
		*/
		Fiber = Npm.require('fibers');
		var client = new MtGoxClient(
			Meteor.settings.MtGoxApi.key, 
			Meteor.settings.MtGoxApi.secret
		);
		var updateMtGox = function() {
			client.query('1/BTCUSD/public/ticker', {}, function(json) {
				var timestamp = new Date().getTime();
				Fiber(function() { 
					Chat.insert({value: json.return.last.value, time: timestamp});
				}).run();
				setTimeout(updateMtGox, 1000);
			});
		};
		updateMtGox();
		
	});
	

	
	var sendEmail = function (to, from, subject, text) {
		Email.send({
			to: to,
			from: from,
			subject: subject,
			text: text
	    });
	};
    
	
	
	
		
	//key: cb009506-3088-4a03-ad82-685e8002eee3
	//secret: 1qeHdsEI1louBFbcamJjrz5XkMQHX6nzZITsO331mJncgPGI0vnJpGPdzZVjZ1tMzr7rM9VSr90EknLV5wZEJQ==
}
