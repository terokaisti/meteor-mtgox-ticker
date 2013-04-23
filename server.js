if (Meteor.isServer) {
	var require = Npm.require,
		path = require('path'),
		util = require('util'),
		datetime = require(path.resolve('.')+'/public/node_modules/datetime/lib/datetime'),
		mtgox = require(path.resolve('.')+'/public/node_modules/mtgox-socket-client/mtgox'),
		Fiber = Npm.require('fibers');
	;

	Meteor.startup(function() {
		Messages.remove({});
		var messagesId = Messages.insert({});

		var responseMessage = function() {
			output = [].join.call(arguments, " ");
			console.log(output);
			Fiber(function() {
				Messages.update(messagesId, {value: output});
			}).run();
		};
		
		var client = mtgox.connect();
		
		var lastTradePrice = -1;
		var lastTickerPrice = -1;
		var lastTickerVolume = -1;

		client.on('open', function() {
		  // Good place to unsubscribe from unwanted channels
		  // client.unsubscribe(mtgox.getChannel('trade').key);
		  //client.unsubscribe(mtgox.getChannel('depth').key);
		  //client.unsubscribe(mtgox.getChannel('ticker').key);
		});

		client.on('subscribe', function(message) {
			renderSubscribeMessage(message);
		});

		client.on('unsubscribe', function(message) {
			renderUnsubscribeMessage(message);
		});

		client.on('trade', function(message) {
			renderTradeMessage(message, lastTradePrice);
			lastTradePrice = message.trade.price;
		});

		client.on('depth', function(message) {
			renderDepthMessage(message);
		});

		client.on('ticker', function(message) {
			renderTickerMessage(message, lastTickerPrice);
			lastTickerPrice = message.ticker.last;
			lastTickerVolume = message.ticker.vol;
		});

		process.on('exit', function() {
			responseMessage('Goodbye!');
			client.close();
		});
		
		var renderSubscribeMessage = function(message) {
			var format = 'Subscribed to channel:';
			responseMessage(getTimeFormat(), format, getChannelFormat(message));
		};

		var renderUnsubscribeMessage = function(message) {
			var format = 'Unsubscribed from channel:';
			responseMessage(getTimeFormat(), format, getChannelFormat(message));
		};

		var renderTradeMessage = function(message, lastPrice) {
			responseMessage(getTimeFormat(), getTradeFormat(message.trade, lastPrice));
		};

		var renderTickerMessage = function(message, lastPrice) {
			responseMessage(getTimeFormat(), getTickerFormat(message.ticker, lastPrice));
		};

		var renderDepthMessage = function(message) {
			responseMessage(getTimeFormat(), getDepthFormat(message.depth));
		};
		
	});

	var getDepthFormat = function(depth) {
		var format = '';

		if (depth.volume < 0) {
			format += '+ ';
		}
		else {
			format += '- ';
		};

		if (depth.type_str == 'ask') {
			format += 'Ask: ';
		}
		else if (depth.type_str = 'bid') {
			format += 'Bid: ';
		}

		var amount = Math.abs(depth.volume);
		var price = Math.abs(depth.price);

		format += (amount + ' ' + depth.item) + ' @ ';
		format += getPriceFormat(price, price, depth.currency);

		return format;
	};

	var getTickerFormat = function(ticker, lastPrice) {
		var format = '> ';

		var last = 'Last: ';
		var high = 'High: ';
		var low = 'Low: ';
		var vol = 'Vol: ';
		var avg = 'Avg: ';

		last += getPriceFormat(ticker.last.display, lastPrice);
		high += ticker.high.display;
		low += ticker.low.display;
		vol += ticker.vol.display;
		avg += ticker.vwap.display;

		return format + [vol, high, low, avg, last].join(' ');
	};

	var getTradeFormat = function(trade, lastPrice) {
		var format = '$ ';

		if (trade.trade_type == 'ask') {
			format += 'Ask: ';
		}
		else if (trade.trade_type == 'bid') {
			format += 'Bid: ';
		}
		format += (trade.amount + ' ' + trade.item) + ' @ ';
		format += getPriceFormat(trade.price, lastPrice, trade.price_currency);

		Fiber(function() {
			if (trade.price_currency == 'USD') {
				Trades.insert({value: trade.price, time: new Date().getTime()});
			}
		}).run();

		return format;
	};

	var getChannelFormat = function(message) {
		var channel = mtgox.getChannel(message.channel)||message.channel;
		return channel.name;
	};

	var getTimeFormat = function() {
		var now = new Date();
		var time = '[' + datetime.format(now, '%T') + ']';
		return time;
	};

	var getPriceFormat = function(currentPrice, lastPrice, currency) {
		var format = currentPrice + (currency ? ' ' + currency : '');
		if (lastPrice < 0) {
			return format;
	  	}

		var delta = lastPrice - currentPrice;
		var percent = (lastPrice > 0) ? (delta / lastPrice) * 100 : 100;
		var round = function(n) {
			return Math.round(Math.abs(n) * 100) / 100;
		};

		if (delta > 0) {
			format += (' +' + round(delta) + ' +' + round(percent) + '%');
		}
		else if (delta < 0) {
			format += (' -' + round(delta) + ' -' +round( percent) + '%');
		}

		return format;
	};
}
