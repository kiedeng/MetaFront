from flask import Flask, render_template, request, jsonify, send_from_directory, Response
import time
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat-stream')
def chat_stream():
    message = request.args.get('message')
    responses = [
        message,
        "这是第二部分回应。",
        {"type": "text", "content": "这是第三部分回应，带有文字。"},
        {"type": "image", "content": "/uploads/sample_image.jpg"},
        {"type": "file", "content": "/uploads/sample.txt"}
    ]
    
    def generate():
        for response in responses:
            if isinstance(response, dict):
                yield f"data: {response['type']}|{response['content']}\n\n"
            else:
                for char in response:
                    yield f"data: text|{char}\n\n"
                    time.sleep(0.05)  # Adjust speed here
                yield f"data: text|\n\n"  # Indicate end of response
            time.sleep(1)  # Wait before sending the next part

    return Response(generate(), mimetype='text/event-stream')

@app.route('/send-message', methods=['POST'])
def send_message():
    message = request.form['message']
    # Here you would normally process the message and generate a response.
    return jsonify(success=True)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
