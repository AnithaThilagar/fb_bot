'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    apiai = require('apiai'),
    app = express(),
    apiaiApp = apiai('9aa0c027ec0543f3b0a30ed3f829297b');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.port || 5000, () => {
    console.log('Express server running on port %d in %s mode ', server.address().port, app.settings.env);
});

app.get('/', (req, res) => {
    console.log("Inside get method");
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'reportIt') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

app.post('/', (req, res) => {
    console.log("Inside post method");
    console.log(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                    console.log("Inside msg");
                    sendMessage(event);
                } else if (event.account_linking) {
                    console.log("Inside acc_link");
                } else if (event.postback) {
                    console.log("Inside postback");
                } else {
                    console.log("Inside unknown event");
                }
            });
        });
        res.status(200).end();
    }
});

function sendMessage(event) {
    console.log("Inside send Msg ");
    let sender = event.sender.id;
    let text = event.message.text;

    console.log("Text ", text);

    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'reportIt'
    });

    apiai.on('response', (response) => {
        console.log(response);
        let aiText = response.result.fulfillment.speech;

        console.log('Text from DF ', aiText);

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: 'EAAFwXfBX3n4BAPyrwV5cq8pOHaYPu8KKOrAiyz14lDtTlBCgu3cbs5tqsFNd5HItSyng3qUZCecWMANWDorPDQvFkhsH0KZCqMiFLJEpf6l86PpKVFW0EiS40iHqi4T7F7pSVUgOSlDzonItWpSogOW7fwgzw0884PTeZBYUQZDZD' },
            method: 'POST',
            json: {
                recipient: { id: sender },
                message: { text: text },
                messages: [
                    {
                        "type": 0,
                        "platform": "facebook",
                        "speech": text
                    }
                ]
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    });

    apiai.on('error', (error) => {
        console.log("Error in api ai " + error);
    });

    apiai.end();
}