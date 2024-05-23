document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var message = document.getElementById('message').value;
    var chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += '<div class="chat-message user"><img src="path/to/user-avatar.jpg" class="avatar"><div class="message-content"><strong>你:</strong> ' + message + '</div></div>';
    
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

            source.onmessage = function(event) {
                var response = JSON.parse(event.data);
                var type = response.type;
                var content = response.content;

                if (type === 'text') {
                    chatBox.innerHTML += '<div class="chat-message ai"><img src="path/to/ai-avatar.jpg" class="avatar"><div class="message-content"><strong>AI:</strong> <span>' + content + '</span></div></div>';
                } else if (type === 'image') {
                    chatBox.innerHTML += '<div class="chat-message ai"><img src="path/to/ai-avatar.jpg" class="avatar"><div class="message-content"><strong>AI:</strong> <img src="' + content + '" class="clickable-image" /></div></div>';
                } else if (type === 'file') {
                    chatBox.innerHTML += '<div class="chat-message ai"><img src="path/to/ai-avatar.jpg" class="avatar"><div class="message-content"><strong>AI:</strong> <a href="' + content + '" download class="btn btn-secondary">下载文件</a></div></div>';
                } else if (type === 'table') {
                    chatBox.innerHTML += '<div class="chat-message ai"><img src="path/to/ai-avatar.jpg" class="avatar"><div class="message-content">' + content + '</div></div>';
                } else if (type === 'markdown') {
                    var converter = new showdown.Converter();
                    var html = converter.makeHtml(content);
                    chatBox.innerHTML += '<div class="chat-message ai"><img src="path/to/ai-avatar.jpg" class="avatar"><div class="message-content markdown-content">' + html + '</div></div>';
                    
                    document.querySelectorAll('.markdown-content pre code').forEach((block) => {
                        hljs.highlightElement(block);
                        
                        // Add copy button
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
