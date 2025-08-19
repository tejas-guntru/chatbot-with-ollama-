class ChatApp {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.checkStatus();
        this.loadModels();
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-btn');
        this.modelSelect = document.getElementById('model-select');
        this.statusElement = document.getElementById('status');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        this.modelSelect.addEventListener('change', () => {
            this.showMessage(`Model changed to: ${this.modelSelect.value}`, 'bot');
        });
    }

    async checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.status === 'running') {
                this.statusElement.textContent = `✅ Ollama running (${data.models} models)`;
                this.statusElement.style.color = 'green';
            } else {
                this.statusElement.textContent = '❌ Ollama offline - Start with: ollama serve';
                this.statusElement.style.color = 'red';
            }
        } catch (error) {
            this.statusElement.textContent = '❌ Cannot connect to server';
            this.statusElement.style.color = 'red';
        }
    }

    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            
            if (data.models && data.models.length > 0) {
                this.modelSelect.innerHTML = '';
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    this.modelSelect.appendChild(option);
                });
            } else {
                this.modelSelect.innerHTML = '<option value="">No models found</option>';
            }
        } catch (error) {
            this.modelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const selectedModel = this.modelSelect.value;
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: selectedModel
                })
            });

            const data = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator();

            if (data.response) {
                this.addMessage(data.response, 'bot');
            } else if (data.error) {
                this.addMessage(`Error: ${data.error}`, 'bot');
            }
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Error: Could not connect to server', 'bot');
        }
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        messageDiv.innerHTML = `
            <div class="avatar">${type === 'user' ? '👤' : '🤖'}</div>
            <div class="content">${this.formatMessage(text)}</div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `
            <div class="avatar">${type === 'user' ? '👤' : '🤖'}</div>
            <div class="content">${this.formatMessage(text)}</div>
        `;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Convert URLs to clickable links
        return text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" style="color: #4facfe; text-decoration: none;">$1</a>'
        );
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="content typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chat app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});