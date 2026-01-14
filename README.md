# Gemini AI Chatbot 🤖

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

A clean and modern AI chatbot web application powered by Google's Gemini AI API. Built with vanilla HTML, CSS, and JavaScript.

## ✨ Features

- 💬 **Real-time Chat Interface** - Smooth and responsive messaging
- 🤖 **Gemini 2.5 Flash** - Powered by Google's latest AI model
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 💾 **Chat History** - Conversations persist using localStorage
- 📝 **Markdown Support** - Rich text formatting in AI responses
- ⚡ **Quick Suggestions** - Pre-made prompts for instant questions
- 🧹 **Clear Chat** - Reset conversation anytime
- ⌨️ **Keyboard Support** - Press Enter to send messages
- 📊 **Character Counter** - Track message length (500 char limit)
- 📱 **Responsive Design** - Works on desktop and mobile

## 📁 Project Structure

```
Gemini-AI-Chatbot/
├── index.html           # Main HTML file
├── style.css            # Stylesheet
├── script.js            # JavaScript logic
├── config.js            # API configuration (not tracked)
├── config.example.js    # Config template
├── marked.min.js        # Markdown parser (optional)
├── .gitignore           # Git ignore rules
└── README.md            # Documentation
```

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling & Animations |
| JavaScript ES6+ | Logic & API Integration |
| Google Gemini API | AI Processing |
| Marked.js | Markdown Rendering |
| LocalStorage | Data Persistence |

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/avy2025/Gemini-AI-Chatbot.git
cd Gemini-AI-Chatbot
```

### 2. Get your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key

### 3. Configure the API Key

```bash
cp config.example.js config.js
```

Open `config.js` and add your API key:

```javascript
const CONFIG = {
    GEMINI_API_KEY: "your-actual-api-key-here"
};
```

> **⚠️ Important:** Never commit `config.js` to GitHub. It's already in `.gitignore`.

### 4. Run the Application

Simply open `index.html` in your web browser. No server required!

```bash
# Or use a local server
python -m http.server 8000
# Then visit http://localhost:8000
```

## 🎯 Usage

### Basic Chat
1. Type your message in the input field
2. Click **Send** or press **Enter**
3. Wait for the AI to respond

### Quick Suggestions
Click any suggestion button to instantly send a question:
- ⚛️ Quantum Physics
- ✍️ Write Poem
- 🎉 Fun Fact
- 💻 Code Challenge

### Dark Mode
Click the 🌙/☀️ button in the header to toggle dark mode. Your preference is saved automatically.

### Clear Chat
Click **Clear Chat** to reset the conversation and remove all messages.

## 🔧 Configuration

### Markdown Support

AI responses support the following markdown:

- **Bold text** - `**text**`
- *Italic text* - `*text*`
- `Inline code` - `` `code` ``
- Code blocks - ` ```language ... ``` `
- Lists - `- item` or `1. item`
- Links - `[text](url)`
- Blockquotes - `> quote`

### Character Limit

Messages are limited to 500 characters. The counter turns red when you exceed the limit.

## 🔐 Security Notes

This is a frontend-only implementation for learning purposes. For production use:

- ✅ Use a backend server to handle API calls
- ✅ Store API keys securely on the server side
- ✅ Implement rate limiting
- ✅ Add user authentication
- ✅ Sanitize user inputs

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Commit with a clear message (`git commit -m "feat: add new feature"`)
5. Push to your branch (`git push origin feature/improvement`)
6. Open a Pull Request

## 📝 Commit Convention

This project follows conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Code style changes

## 🗺️ Roadmap

- [ ] Voice input support
- [ ] Export chat as PDF
- [ ] Multiple chat sessions
- [ ] Image generation support
- [ ] Settings panel for customization
- [ ] Mobile app version
- [ ] Multi-language support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**avy2025**

- GitHub: [@avy2025](https://github.com/avy2025)
- Project: [Gemini-AI-Chatbot](https://github.com/avy2025/Gemini-AI-Chatbot)

## 🙏 Acknowledgments

- Google for the Gemini API
- Marked.js for markdown parsing
- The open-source community

## 📞 Support

If you have any questions or run into issues:

1. Check the [Issues](https://github.com/avy2025/Gemini-AI-Chatbot/issues) page
2. Create a new issue with details
3. Contact via GitHub

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [avy2025](https://github.com/avy2025)

</div>