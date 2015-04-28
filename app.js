var dotenv = require('dotenv');
dotenv.load();

var express = require('express'),
    http = require('http'),
    path = require('path'),
    sendgrid = require('sendgrid')(process.env.api_key);

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

  var cardEmail = new sendgrid.Email({
    to: email,
    from: process.env.FROM_ADDRESS,
    fromname: process.env.FROM_NAME,
    subject: process.env.SUBJECT,
    html: '<h2>Thanks for requesting a business card!</h2>', // body tag for text
    text: 'Thanks for asking for a business card, sorry I didn\'t have any on me!' //body tag for html
  });

  
  // add some extra stuff
  cardEmail.setFilters({"templates": {"settings": {"enabled": 1, "template_id": "325ae5e7-69dd-4b95-b003-b0109f759cfa"}}});
  cardEmail.addSubstitution('-from_name-', process.env.FROM_NAME);
  cardEmail.addSubstitution('-twitter-', process.env.TWITTER);
  cardEmail.addSubstitution('-from_address-', process.env.FROM_ADDRESS);
  cardEmail.addSubstitution('-sign_off-', process.env.SIGN_OFF);
  cardEmail.addSubstitution('-signature-', process.env.SIGNATURE);
  cardEmail.addSubstitution('-card_image_url-', process.env.CARD_IMAGE_URL);

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

app.get('/', function(req, res){
  res.render('index.html');
});

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
