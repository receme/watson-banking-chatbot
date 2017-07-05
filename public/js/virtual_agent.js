'use strict';

$(document).ready(function() {
    const BOT_ID = '243a9b97-ccd0-4e3f-81b5-b2261eb2d67b';
    const textInput = document.getElementById('userInputText');
    const submitBtn = document.getElementById('sendBtn');

    const SDK = require('@watson-virtual-agent/client-sdk');

    SDK.configure({
        XIBMClientID: '0ce76b82-89a0-4fed-8060-7686566b1a30',
        XIBMClientSecret: 'W5vE0bG4qE1dU2cX0nG8tE0lU2oX7pE0eG1jR6aB7nA8kY0eU6'
    });

    SDK.start(BOT_ID)
        .then(response => {
            const chatID = res.chatID;
            const onRequest = message => {
                console.log('You:', message);
            };
            const onResponse = response => {
                response.message.text.forEach(text => {
                    console.log('Agent:', text);
                });
            };
            onResponse(response);
            submitBtn.addEventListener('click', () => {
                const message = textInput.value;
                onRequest(message);
                SDK.send(BOT_ID, chatID, message)
                    .then(onResponse)
                    .catch(err => console.error(err));
            });
        })
        .catch(err => console.error(err));
});