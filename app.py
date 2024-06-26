from flask import Flask, render_template, request, jsonify, send_from_directory, Response
import time
import os
import json
import asyncio

from metagpt.llm import LLM
from metagpt.logs import logger

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
clients = []


def send_data():
    count = 0
    while True:
        # 在这里可以根据需要生成数据
        data = 'data: {}\n\n'.format(count)
        for client in clients:
            client.put(data)
        count += 1
        time.sleep(1)  # 这里可以根据需要调整发送数据的频率

class ClientQueue:
    def __init__(self):
        self.queue = []

    def put(self, item):
        self.queue.append(item)

    def get(self):
        return self.queue.pop(0) if self.queue else None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat-stream')
async def chat_stream():
    result = await llm.aask("what's your name?", system_msgs=["I'm a helpful AI assistant."])
    message = request.args.get('message')
    responses = [
         {"type": "text", "content": result},
        {"type": "text", "content": message},
        {"type": "text", "content": "<br/>这是第二部分回应。<br/>"},
        {"type": "text", "content": "这是第三部分回应，带有文字。<br/>"},
        # {"type": "image", "content": "/uploads/sample_image.jpg"},
        {"type": "file", "content": "/uploads/sample.txt"},
        {"type": "table", "content": generate_table()},
        {"type": "markdown", "content": "\n### 这是一个Markdown标题\n\n## 这是一些Markdown内容。\n```python\nprint('Hello, World!')\n```"},
        {"type": "end", "content": "结束"}
    ]


    client_queue = ClientQueue()
    clients.append(client_queue)


    async def generate():

        for response in responses:
            res = 0
            while True:
                res += 1
                if res > 5:
                    break
                data = client_queue.get()
                if data:
                    yield data
                else:
                    time.sleep(0.1)

            if response['type'] in ['text', 'markdown']:
                for char in response['content']:
                    yield f"data: {json.dumps({'type': response['type'], 'content': char})}\n\n"
                    time.sleep(0.05)  # Adjust speed here
            else:
                yield f"data: {json.dumps(response)}\n\n"
            time.sleep(1)  # Wait before sending the next part

    return Response(generate(), mimetype='text/event-stream')

@app.route('/send-message', methods=['POST'])
def send_message():
    message = request.form['message']
    return jsonify(success=True)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def generate_table():
    data = [
        ["Column 1", "Column 2"],
        ["Data 1", "Data 2"],
        ["Data 3", "Data 4"]
    ]

    if not data:
        return "<p>没有数据可显示。</p>"

    table_html = '<table class="table table-striped table-bordered"><thead><tr>'
    for header in data[0]:
        table_html += f'<th style="background-color: #f1f1f1; font-weight: bold; color: #343a40;">{header}</th>'
    table_html += '</tr></thead><tbody>'

    for row in data[1:]:
        table_html += '<tr>'
        for cell in row:
            table_html += f'<td>{cell}</td>'
        table_html += '</tr>'

    table_html += '</tbody></table>'
    return table_html

if __name__ == '__main__':
    llm = LLM()
    app.run(debug=True)
