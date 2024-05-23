from flask import Flask, render_template, request, jsonify, send_from_directory, Response
import time
import os
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat-stream')
def chat_stream():
    message = request.args.get('message')
    responses = [
        {"type": "text", "content": message},
        {"type": "text", "content": "这是第二部分回应。"},
        {"type": "text", "content": "这是第三部分回应，带有文字。"},
        {"type": "image", "content": "/uploads/sample_image.jpg"},
        {"type": "file", "content": "/uploads/sample.txt"},
        {"type": "table", "content": generate_table()},
        {"type": "markdown", "content": """### 这是一个Markdown标题\n\n###### \*这是一些Markdown内容*/\n```python\nprint('Hello, World!')\n
         print('Hello, World!')\nprint('Hello, World!')\nprint('Hello, World!')\nprint('Hello, World!')\nprint('Hello, World!')\n```"""}
    ]
    
    def generate():
        for response in responses:
            response_data = json.dumps(response)
            print(response)
            yield f"data: {response_data}\n\n"
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
    app.run(debug=True)
