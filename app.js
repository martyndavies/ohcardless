var dotenv = require('dotenv');
dotenv.load();

var express = require('express'),
    http = require('http'),
    path = require('path'),
    sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

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
  cardEmail.addFilter('footer', 'enable', 1);
  cardEmail.addFilter('footer', 'text/html', '<div style=\"width:100%; text-align:center;\"><p>This app uses the <a href=\"http://sendgrid.com/docs/API_Reference/Webhooks/parse.html\">SendGrid Inbound Parse Webhook</a> &amp; <a href=\"http://github.com/sendgrid/sendgrid-nodejs\">NodeJS library</a>. You should too.</p></div>');

  sendgrid.send(cardEmail, function(err, json){
      if (err) {
        callback(err);
      } else {
        callback(json);
      }
    });
};

function forwardEmail(from, fromname, subject, body, callback){
  console.log(fromname);
  var emailToForward = new sendgrid.Email({
    to: process.env.FORWARD_EMAIL,
    from: from,
    replyto: from,
    fromname: fromname,
    subject: subject,
    html: body
  });

  sendgrid.send(emailToForward, function(err, json){
    if (err){
      callback(err);
    } else {
      callback(json);
    }
  });
};

function shouldReply(subject){
  var lowercaseSubject = subject.toLowerCase();
  if (lowercaseSubject == process.env.REPLY_PHRASE.toLowerCase()){
    console.log('Subject matches phrase, replying...');
    return true;
  } else {
    return false;
  }
};

app.post('/receive', function(req, res){
  if(fromAddress = req.body.from.match(/<(.+)>/)){
    var email = fromAddress[1];
    var name = fromAddress[0];
  } else {
    var email = req.body.from;
  }

  // should we reply to this email?
  var reply = shouldReply(req.body.subject);

  // yes, we should!
  if (reply) {
    replyWithCard(email, function(response){
      console.log(response);
      if (response.message == "success") {
        res.send(200);
      }
    });

  // no, we should not!
  } else {
    console.log('Forwarding....');
    if (req.body.html){
      var content = req.body.html;
    } else {
      var content = req.body.text;
    }

    var thefromname = req.body.from.split(' ');

    forwardEmail(email, thefromname[0]+' '+thefromname[1], req.body.subject, content, function(response){
      console.log(response);
      if (response.message == "success") {
        console.log('Email successfully forwarded!');
        res.send(200);
      }
    });
  }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
