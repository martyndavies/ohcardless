var dotenv = require('dotenv');
dotenv.load();

var express = require('express')
  , http = require('http')
  , path = require('path')
  , sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD)
  , strp = require('sendstrip');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function replyWithCard(email, callback){
	var text_block = "Thanks for asking for a business card, sorry I didn\'t have any on me!\n\n";
			text_block += "Here are my details:\n\n";
			text_block += "Name: "+process.env.FROM_NAME+"\n";
			text_block += "Twitter: "+process.env.TWITTER+"\n";
			text_block += "Email: "+process.env.FROM_ADDRESS+"\n\n";
			text_block += "You can reply to this email to contact me directly.\n\n";
			text_block += process.env.SIGN_OFF+"\n\n";
			text_block += process.env.SIGNATURE;

	var html_block = "<div style=\"width=100%; text-align:center;\">";
			html_block += "<h2>Thanks for requesting a business card!</h2>";
			html_block += "<p><img src=\""+process.env.CARD_IMAGE_URL+"\"/></p>";
			html_block += "<p style=\"font-family:arial; font-size: 14px;\">You can also contact me directly by replying to this email.</p>";
			html_block += "</div>";

	var cardEmail = new sendgrid.Email({
		to: email,
		from: process.env.FROM_ADDRESS,
		fromname: process.env.FROM_NAME,
		subject: process.env.SUBJECT,
		text: text_block,
		html: html_block
	});

	// add some extra stuff
	cardEmail.addFilterSetting('footer', 'enable', 1);
	cardEmail.addFilterSetting('footer', 'text/html', '<div style=\"width:100%; text-align:center;\"><p>This app uses the <a href=\"http://sendgrid.com/docs/API_Reference/Webhooks/parse.html\">SendGrid Inbound Parse Webhook</a> &amp; <a href=\"http://github.com/sendgrid/sendgrid-nodejs\">NodeJS library</a>. You should too.</p></div>');

	sendgrid.send(cardEmail, function(err, json){
			if (err) {
				callback(err);
			} else {
				console.log("sent!");
				callback(json);
			}
		});
};

app.post('/receive', function(req, res){
	if(fromAddress = req.body.from.match(/<(.+)>/)){
		var email = fromAddress[1];
	} else {
		var email = req.body.from;
	}
	replyWithCard(email, function(response){
		console.log(response);
		if (response.message == "success") {
			res.send(200);
		}
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
