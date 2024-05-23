document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var message = document.getElementById('message').value;
    var chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += '<div class="chat-message user"><img src="uploads/user-avatar.jpg" class="avatar"><div class="message-content"><strong>你:</strong> ' + message + '</div></div>';
    
    fetch('/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'message=' + encodeURIComponent(message)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            var source = new EventSource('/chat-stream?message=' + encodeURIComponent(message));
            var aiMessageContent = '';

            // Create a unique ID for the AI message content
            var uniqueId = 'ai-message-content-' + Date.now();

            // Create an AI message container
            var aiMessageContainer = document.createElement('div');
            aiMessageContainer.className = 'chat-message ai';
            aiMessageContainer.innerHTML = '<img src="uploads/ai-avatar.jpg" class="avatar"><div class="message-content" id="' + uniqueId + '"></div>';
            chatBox.appendChild(aiMessageContainer);
            var aiContentElement = document.getElementById(uniqueId);

            source.onmessage = function(event) {
                var response = JSON.parse(event.data);
                var type = response.type;
                var content = response.content;

                if (type === 'text') {
                    aiMessageContent += content;
                    aiContentElement.innerHTML = '<span>' + aiMessageContent + '</span>';
                } else if (type === 'image') {
                    aiMessageContent += '<div><img src="' + content + '" class="clickable-image" /></div>';
                    aiContentElement.innerHTML = aiMessageContent;
                } else if (type === 'file') {
                    aiMessageContent += '<div><a href="' + content + '" download class="btn btn-secondary">下载文件</a></div>';
                    aiContentElement.innerHTML = aiMessageContent;
                } else if (type === 'table') {
                    aiMessageContent += '<div>' + content + '</div>';
                    aiContentElement.innerHTML = aiMessageContent;
                } else if (type === 'markdown') {
                    aiMessageContent += content;
                    var converter = new showdown.Converter();
                    var html = converter.makeHtml(aiMessageContent);
                    aiContentElement.innerHTML = '<div class="markdown-content">' + html + '</div>';

                    setTimeout(function() {
                        document.querySelectorAll('.markdown-content pre code').forEach((block) => {
                            hljs.highlightElement(block);

                            var button = document.createElement('button');
                            button.className = 'copy-button';
                            button.innerText = '复制';
                            button.addEventListener('click', function() {
                                var code = block.innerText;
                                navigator.clipboard.writeText(code).then(function() {
                                    alert('代码已复制到剪贴板');
                                }).catch(function(err) {
                                    console.error('复制失败:', err);
                                });
                            });
                            block.parentNode.insertBefore(button, block);
                        });
                    }, 100);
                } else if (type === 'end') {
                    source.close();
                }

                chatBox.scrollTop = chatBox.scrollHeight;
            };

            source.onerror = function(event) {
                console.error("EventSource failed:", event);
                source.close();
            };
        } else {
            console.error('Network response was not ok.');
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });

    document.getElementById('message').value = '';
});

// Click event listener for clickable images
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('clickable-image')) {
        var imgSrc = e.target.src;
        var modalHtml = '<div class="modal" tabindex="-1" role="dialog" id="imageModal">' +
            '<div class="modal-dialog modal-dialog-centered" role="document">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h5 class="modal-title">图片预览</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<img src="' + imgSrc + '" class="img-fluid">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        $('#imageModal').modal('show');
        $('#imageModal').on('hidden.bs.modal', function () {
            document.getElementById('imageModal').remove();
        });
    }
});
