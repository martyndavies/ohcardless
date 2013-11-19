## Oh, cardless!

I've either forgotten my cards, or I've run out. Either way, someone is going to ask for my details and it's a pain to write it all down because they'll probably lose it and we've all wasted our time.

So I knocked up this quick app using SendGrid and Heroku to give me a quick autoresponder on my vanity email address that will send a digital version of my business card out to whomever emails that address. It's quick to turn around and gets my details direct to their inbox.

### Install

Start by cloning this repository, then follow these instructions at the command line:

```html
$ heroku create
$ heroku addons:add sendgrid:starter
$ heroku config:set FROM_ADDRESS="mymail@myaddress.com" #make sure you change this to your email
$ heroku config:set FROM_NAME="Martyn Davies (SendGrid)"
$ heroku config:set SUBJECT="My business card"
$ heroku config:set TWITTER="@martynd"
$ heroku config:set SIGN_OFF="Nice meeting you!"
$ heroku config:set SIGNATURE="MD"
$ heroku config:set CARD_IMAGE_URL="https://dl.dropboxusercontent.com/u/5857478/mycards/businesscard-back.png"
```
As you can see above, most of these settings are pieces of the email that gets sent out. If you want to strip this bit out and hardcode your settings then you can do.

This app supports text and HTML emails, the CARD_IMAGE_URL is used in the HTML email and can be any type of graphic (PNG is recommended), just don't make it too big... Hey, maybe the size of an actual business card. I used a copy of the proof I got from the printer for mine.

### Set up SendGrid

To set up SendGrid so your newly deployed to Heroku app can receive emails and send them out properly do the following:

1. Add an MX record to the domain to want to use for this app and set it to '10 mx.sendgrid.net'
2. Wait up to 24 hours... :(
3. Log into SendGrid - Your credentials can be found by running:

```html
$ heroku config
```

4. When you log in you'll be asked a few questions to set up your account, say no to them, for this project you don't need them.
5. Click on 'Global Settings' and tick the box for 'Don't convert plain text emails to HTML', then hit Update.
6. Change your Inbound Parse Webhook settings.
7. Your domain is the domain that you added mx.sendgrid.net to.
8. Your URL is your Heroku app URL with /receiver added to the end.
9. Send an email to anything@yourdomain.com and see what comes back.

### Notes

This app uses the SendGrid Starter add-on that has a hard limit of 200 emails per day. If you think you'll go over this, you're an awesome networker and should probably think about remembering your cards.