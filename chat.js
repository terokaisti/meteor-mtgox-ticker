Chat = new Meteor.Collection('chat');

if (Meteor.isClient) {
	Template.chat.list = function() {
		return Chat.find({});
	};

	Template.test.events({
		'click #testbutton': function() {
			Meteor.call('getFoo', function(error, response) {
				console.log(response);
			});
		}
	});

	Template.chat.events({
 		'click #button' : function (evt, tmpl) {
			Chat.insert({phrase: tmpl.find('#phrase').value});
		}
	});
	
	
	Meteor.startup(function() {
		return;
	});
}