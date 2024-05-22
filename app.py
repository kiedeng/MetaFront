from flask import Flask, render_template, Response, request
import time

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def generate_response(user_input):
    response_text = f"Echo: {user_input} "  # This is a placeholder for a real AI response.
    response_text = response_text * 300
    for char in response_text:
        yield f"data: {char}\n\n"
        time.sleep(0.1)  # Adjust this delay as necessary

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.form.get('message')
    return Response(generate_response(user_input), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True)
