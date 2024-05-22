document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');

    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const message = chatInput.value;
        if (message.trim() === '') {
            return;
        }
        
        // Display user's message
        const userMessage = document.createElement('div');
        userMessage.className = 'user-message';
        userMessage.textContent = `You: ${message}`;
        chatWindow.appendChild(userMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Send message to server and get stream response
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `message=${encodeURIComponent(message)}`,
        }).then(response => response.body)
          .then(body => {
              const reader = body.getReader();
              const decoder = new TextDecoder();

              function read() {
                  reader.read().then(({ done, value }) => {
                      if (done) {
                          return;
                      }

                      const text = decoder.decode(value);
                      const botMessage = document.querySelector('.bot-message:last-child') || document.createElement('div');
                      if (!botMessage.className) {
                          botMessage.className = 'bot-message';
                          chatWindow.appendChild(botMessage);
                      }
                      botMessage.textContent += text;
                      chatWindow.scrollTop = chatWindow.scrollHeight;

                      read();
                  });
              }

              read();
          });

        chatInput.value = '';
    });
});
