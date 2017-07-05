/*eslint-env browser */
// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var ConversationPanel = (function() {
        var settings = {
            selectors: {
                chatBox: '#scrollingChat',
                fromUser: '.bg-user',
                fromWatson: '.bg-bot',
                latest: '.latest'
            },
            authorTypes: {
                user: 'user',
                watson: 'watson'
            }
        };

        // Publicly accessible methods defined
        return {
            init: init,
            inputKeyDown: inputKeyDown
        };

        // Initialize the module
        function init() {
            chatUpdateSetup();
            Api.sendRequest('', null);
            setupInputBox();
        }
        // Set up callbacks on payload setters in Api module
        // This causes the displayMessage function to be called when messages are sent / received
        function chatUpdateSetup() {
            var currentRequestPayloadSetter = Api.setRequestPayload;
            Api.setRequestPayload = function(newPayloadStr) {
                currentRequestPayloadSetter.call(Api, newPayloadStr);
                displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
            };

            var currentResponsePayloadSetter = Api.setResponsePayload;
            Api.setResponsePayload = function(newPayloadStr) {
                currentResponsePayloadSetter.call(Api, newPayloadStr);
                displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
            };
        }

        function setupInputBox() {
            //var input = document.getElementById('textInput');
            //var dummy = document.getElementById('textInputDummy');
            var padding = 3;

            // if (dummy === null) {
            //     var dummyJson = {
            //         'tagName': 'div',
            //         'attributes': [{
            //             'name': 'id',
            //             'value': 'textInputDummy'
            //         }]
            //     };

            //     dummy = Common.buildDomElement(dummyJson);
            //     ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'].forEach(function(index) {
            //         dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
            //     });

            //     document.body.appendChild(dummy);
            // }

            // input.addEventListener('input', function() {
            //     if (this.value === '') {
            //         this.classList.remove('underline');
            //         this.setAttribute('style', 'width:' + '100%');
            //         this.style.width = '100%';
            //     } else {
            //         this.classList.add('underline');
            //         var txtNode = document.createTextNode(this.value);
            //         dummy.textContent = txtNode.textContent;
            //         var widthValue = (dummy.offsetWidth + padding) + 'px';
            //         this.setAttribute('style', 'width:' + widthValue);
            //         this.style.width = widthValue;
            //     }
            // });

            // var sendBtn = document.getElementById('sendBtn');
            // sendBtn.addEventListener('click', function onClickSendBtn(event) {

            //     var inputchatbox = document.querySelector('.message_input');
            //     // Submit on enter key, dis-allowing blank messages
            //     if (inputchatbox.value) {
            //         // Retrieve the context from the previous server response
            //         var context;
            //         var latestResponse = Api.getResponsePayload();
            //         if (latestResponse) {
            //             context = latestResponse.context;
            //         }

            //         // Send the user message
            //         Api.sendRequest(inputchatbox.value, context);

            //         // Clear input box for further messages
            //         inputchatbox.value = '';
            //         Common.fireEvent(inputchatbox, 'input');
            //     } else {
            //         console.log(" no text added ");
            //     }
            // });

            //Common.fireEvent(input, 'input');
        }

        // Display a user or Watson message that has just been sent/received
        function displayMessage(newPayload, typeValue) {

            var isUser = isUserMessage(typeValue);
            var textExists = (newPayload.input && newPayload.input.text) ||
                (newPayload.output && newPayload.output.text);
            if (isUser !== null && textExists) {


                var textArray = isUser ? newPayload.input.text : newPayload.output.text;
                if (Object.prototype.toString.call(textArray) !== '[object Array]') {
                    textArray = [textArray];
                }

                var responseHtml = "";

                textArray.forEach(function(element) {

                    var messageText = element;

                    var buttonStartTag = "<button>";
                    if (isStringContains(messageText, buttonStartTag)) {

                        var startPos = messageText.indexOf(buttonStartTag);
                        var endPos = messageText.indexOf("</button>");

                        var message = messageText.substring(0, startPos).trim();
                        var btnString = messageText.substring(startPos + buttonStartTag.length, endPos).trim();
                        var btnArray = btnString.split(",");

                        responseHtml += message;

                        responseHtml += "<div class='btn-toolbar'>";
                        for (var i = 0; i < btnArray.length; i++) {
                            var buttonOption = btnArray[i];

                            var btnHtml = "<a class='light-margin-vertical chat-bot-btn btn btn-clear btn-round btn-group btn-sm' "

                            +" data-value=" + buttonOption + ">" +
                                buttonOption +
                                "</a>";

                            responseHtml += btnHtml;
                        }
                        responseHtml += "</div>";

                    } else {
                        responseHtml += messageText;

                        // add double new-line in-between paragraph; except last line
                        if (textArray.indexOf(element) < textArray.length-1) {
                        	responseHtml += "<br/><br/>"
                        }
                    }

                }, this);


                if (isUser) {
                    newPayload.input.text = responseHtml;
                } else {
                    newPayload.output.text = responseHtml;
                }

                // Create new message DOM element
                var messageDivs = buildMessageDomElements(newPayload, isUser);
                var chatBoxElement = document.querySelector(settings.selectors.chatBox);
                var previousLatest = chatBoxElement.querySelectorAll((isUser ?
                        settings.selectors.fromUser : settings.selectors.fromWatson) +
                    settings.selectors.latest);
                // Previous "latest" message is no longer the most recent
                if (previousLatest) {
                    Common.listForEach(previousLatest, function(element) {
                        element.classList.remove('latest');
                    });
                }

                messageDivs.forEach(function(currentDiv) {
                    chatBoxElement.appendChild(currentDiv);
                    // Class to start fade in animation
                    currentDiv.classList.add('load');
                });
                // Move chat to the most recent messages when new messages are added
                scrollToChatBottom();




            }
        }

        // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
        // Returns true if user, false if Watson, and null if neither
        // Used to keep track of whether a message was from the user or Watson
        function isUserMessage(typeValue) {
            if (typeValue === settings.authorTypes.user) {
                return true;
            } else if (typeValue === settings.authorTypes.watson) {
                return false;
            }
            return null;
        }

        function isStringContains(stringvalue, substring) {
            if (stringvalue.indexOf(substring) !== -1) {
                return true;
            } else {
                return false;
            }
        }

        // Constructs new DOM element from a message payload
        function buildMessageDomElements(newPayload, isUser) {
            var textArray = isUser ? newPayload.input.text : newPayload.output.text;
            if (Object.prototype.toString.call(textArray) !== '[object Array]') {
                textArray = [textArray];
            }
            var messageArray = [];

            textArray.forEach(function(currentText) {
                if (currentText) {
                    var messageJson = {
                        // <div class='segments'>
                        'tagName': 'div',
                        'classNames': ['segments', 'row'],
                        'children': [{
                            // <div class='from-user/from-watson latest'>
                            'tagName': 'div',
                            'classNames': [(isUser ? 'bg-user' : 'bg-bot'), (isUser ? 'pull-right' : 'pull-left'), 'latest', 'chat-bubble', ((messageArray.length === 0) ? 'top' : 'sub')],
                            'children': [{
                                // <div class='message-inner'>
                                'tagName': 'div',
                                'classNames': ['message-inner'],
                                'children': [{
                                    // <p>{messageText}</p>
                                    'tagName': 'p',
                                    'text': currentText
                                }]
                            }]
                        }]
                    };
                    messageArray.push(Common.buildDomElement(messageJson));
                }
            });

            return messageArray;
        }


        // Scroll to the bottom of the chat window (to the most recent messages)
        // Note: this method will bring the most recent user message into view,
        //   even if the most recent message is from Watson.
        //   This is done so that the "context" of the conversation is maintained in the view,
        //   even if the Watson message is long.
        function scrollToChatBottom() {
            var scrollingChat = document.querySelector('#scrollingChat');

            // Scroll to the latest message sent by the user
            var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser + settings.selectors.latest);
            if (scrollEl) {
                scrollingChat.scrollTop = scrollEl.offsetTop;
            }
        }

        // Handles the submission of input
        function inputKeyDown(userText) {

            // Submit on enter key, dis-allowing blank messages
            //if (event.keyCode === 13 && inputBox.value) {
            // Retrieve the context from the previous server response
            var context;
            var latestResponse = Api.getResponsePayload();
            if (latestResponse) {
                context = latestResponse.context;
            }

            // Send the user message
            Api.sendRequest(userText, context);


            //Common.fireEvent(null, 'input');
            //}
        }

    }

    ());