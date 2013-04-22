Messages = new Meteor.Collection('messages');
Trades = new Meteor.Collection('trades');

if (Meteor.isClient) {
	Template.messages.value = function() {
		var o = Messages.find().fetch()[0];
		if (o) {
			return o.value;
		}
	};
	
	Meteor.startup(function() {
	});
}