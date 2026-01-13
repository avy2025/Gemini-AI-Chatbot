# Gemini AI Chatbot 🤖

A simple AI chatbot web application built with HTML, CSS, and JavaScript, powered by Google's Gemini AI.

## Features

- 💬 Real-time chat interface
- 🤖 Powered by Gemini AI
- 🧹 Clear chat history
- ⌨️ Enter key support
- 📱 Responsive design

## Project Structure

```
Gemini-AI-Chatbot/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── script.js           # JavaScript logic
├── config.example.js   # Config template
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/avy2025/Gemini-AI-Chatbot.git
cd Gemini-AI-Chatbot
```

### 2. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Configure the API Key

1. Copy the example config file:
   ```bash
   cp config.example.js config.js
   ```

2. Open `config.js` and replace `YOUR_API_KEY_HERE` with your actual API key:
   ```javascript
   const CONFIG = {
       GEMINI_API_KEY: "your-actual-api-key-here"
   };
   ```

⚠️ **Important:** Never commit `config.js` to GitHub! It's already in `.gitignore`.

### 4. Run the Application

Simply open `index.html` in your web browser. No server needed!

## Usage

1. Type your message in the input field
2. Click "Send" or press Enter
3. Wait for the AI to respond
4. Use "Clear Chat" to reset the conversation

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Google Gemini AI API

## Security Note

This is a frontend-only implementation. For production use, it's recommended to:
- Use a backend server to handle API calls
- Store API keys securely on the server
- Implement rate limiting

## Future Improvements

- [ ] Save chat history (localStorage)
- [ ] Quick suggestion buttons
- [ ] Copy response feature
- [ ] Dark mode
- [ ] Export chat history
- [ ] Voice input

## Author

Created by [avy2025](https://github.com/avy2025)

## License

This project is open source and available for educational purposes.