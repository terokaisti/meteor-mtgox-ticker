Messages = new Meteor.Collection('messages');
Trades = new Meteor.Collection('trades');
Graph = null;

if (Meteor.isClient) {
	
	Template.messages.value = function() {
		o = Trades.find({}, {sort: {time: -1}}).fetch()[0];
		if (o) {
			return o.value;
		}
	};

	Template.graph.rendered = function() {
		if (!this.rendered) {
			this.rendered = true;
			this.node = this.find('#graph');
			Graph = new Graph(this.node);
		}
	};


	Deps.autorun(function() {
		var o = Trades.find({}, {sort: {time: -1}}).fetch()[0];
		if (Graph && o) {
			Graph.add(o.value);
		}

	});

}