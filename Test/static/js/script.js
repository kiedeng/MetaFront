document.addEventListener('DOMContentLoaded', function() {
    var source = new EventSource('/chat-stream');
    var chatBox = document.getElementById('chat-box');
    var messageBuffer = '';

    source.onmessage = function(event) {
        var data = event.data.split('|');
        var type = data[0];
        var content = data[1];

        if (type === 'text') {
            messageBuffer += content;
            if (messageBuffer.endsWith('。') || messageBuffer.endsWith('！') || messageBuffer.endsWith('？')) {
                chatBox.innerHTML += '<div class="chat-message ai"><strong>AI:</strong> <span>' + messageBuffer + '</span></div>';
                messageBuffer = '';
            } else {
                var lastMessage = chatBox.querySelector('.chat-message.ai span');
                if (lastMessage) {
                    lastMessage.textContent = messageBuffer;
                } else {
                    chatBox.innerHTML += '<div class="chat-message ai"><strong>AI:</strong> <span>' + messageBuffer + '</span></div>';
                }
            }
        } else if (type === 'image') {
            chatBox.innerHTML += '<div class="chat-message ai"><strong>AI:</strong> <img src="' + content + '"/></div>';
        } else if (type === 'file') {
            chatBox.innerHTML += '<div class="chat-message ai"><strong>AI:</strong> <a href="' + content + '" target="_blank">点击查看文件</a></div>';
        }

        chatBox.scrollTop = chatBox.scrollHeight;
    };

    source.onerror = function(event) {
        console.error("EventSource failed:", event);
        source.close();
    };
});

document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var message = document.getElementById('message').value;
    var chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += '<div class="chat-message user"><strong>你:</strong> ' + message + '</div>';
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/send-message', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log('Message sent');
        }
    };
    xhr.send('message=' + encodeURIComponent(message));
    
    document.getElementById('message').value = '';
});
