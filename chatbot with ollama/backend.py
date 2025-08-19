from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

class OllamaChatbot:
    def __init__(self):
        self.api_url = "http://localhost:11434/api/generate"
        self.selected_model = "llama3.2"  # Default model
    
    def get_available_models(self):
        """Get list of downloaded models"""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                models_data = response.json()
                return [model['name'] for model in models_data.get('models', [])]
            return []
        except:
            return []
    
    def send_message(self, message, model=None):
        """Send message to Ollama API"""
        if model:
            self.selected_model = model
        
        payload = {
            "model": self.selected_model,
            "prompt": f"### User: {message}\n### Assistant:",
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 1000
            }
        }
        
        try:
            response = requests.post(self.api_url, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result.get('response', 'Error: No response from Ollama').strip()
        except Exception as e:
            return f"Error: {str(e)}"

# Initialize chatbot
chatbot = OllamaChatbot()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        model = data.get('model', '')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        response = chatbot.send_message(message, model)
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    try:
        models = chatbot.get_available_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status():
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        return jsonify({'status': 'running', 'models': len(response.json().get('models', []))})
    except:
        return jsonify({'status': 'offline'})

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("💡 Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)