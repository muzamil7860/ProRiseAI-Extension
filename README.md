# ProRise AI - LinkedIn Assistant 🚀

![Version](https://img.shields.io/badge/version-3.3.6-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Chrome](https://img.shields.io/badge/chrome-88%2B-brightgreen.svg)

An intelligent Chrome extension that supercharges your LinkedIn experience with AI-powered content creation, comment suggestions, and smart replies.

## ✨ Features

### 🎯 Core Features
- **AI Post Creator**: Generate engaging LinkedIn posts from simple prompts
- **Smart Comment Suggestions**: Get 5 contextual comment ideas for any post
- **Reply Generator**: Craft perfect responses to comments and messages
- **Rewrite Anywhere**: Enhance any text with AI-powered rewriting
- **Inbox Assistant**: Generate professional message replies instantly

### 🔧 Advanced Features
- **Keyword Alerts**: Monitor LinkedIn feed for hiring opportunities
- **Background Scanner**: Automatic feed monitoring with notifications
- **WhatsApp Integration**: Get alerts via WhatsApp (optional)
- **Multiple Tones**: Professional, Friendly, Persuasive, Humorous, and more
- **Usage Statistics**: Track your AI-assisted activity

### 🎨 UI Features
- Modern, green-themed ProRise AI branding
- Seamless LinkedIn integration
- Floating action buttons
- One-click content insertion
- Real-time generation feedback

## 📋 Prerequisites

### Required
1. **Google Chrome** (version 88 or higher)
2. **OpenAI API Key** - Get one at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. **LinkedIn Account** - Extension only works on linkedin.com

### Cost Considerations
- You provide your own OpenAI API key
- Charged by OpenAI based on your usage
- Uses `gpt-4o-mini` model (very cost-effective)
- Estimated cost: $0.01-0.05 per 100 generations

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/yourusername/prorise-ai-linkedin.git
   cd prorise-ai-linkedin
   ```

2. **Generate Icon Files**
   - Open `icons/generate-icons.html` in your browser
   - Download the three generated icons (16px, 48px, 128px)
   - Save them in the `icons/` folder

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `linkedin-ai-assistant` folder
   - Extension will appear in your toolbar

4. **Configure API Key**
   - Click the ProRise AI extension icon
   - Go to **Settings** tab
   - Enter your OpenAI API key
   - Click **Save Settings**

### From Chrome Web Store (Coming Soon)
_Extension is currently under review for Chrome Web Store listing_

## ⚙️ Setup & Configuration

### Initial Setup

1. **Add Your API Key**
   ```
   Extension Icon → Settings → OpenAI API Key
   ```
   - Get your key from https://platform.openai.com/api-keys
   - Paste it in the API Key field
   - Click the eye icon to verify
   - Save settings

2. **Choose Default Tone**
   - Professional (default)
   - Friendly
   - Persuasive
   - Storytelling
   - Humorous

3. **Set Comment & Reply Length**
   - Short (10-15 words)
   - Medium (2-5 sentences) - recommended
   - Long (full paragraph)

### Feature Toggles

Enable or disable features in the **Features** tab:
- ✅ Post Creator (enabled by default)
- ✅ Comment Suggestions (enabled by default)
- ☑️ Comment Rewriter
- ✅ Inbox Smart Replies (enabled by default)
- ✅ Rewrite Anywhere (enabled by default)
- ☑️ Hashtag Generator
- ☑️ Auto Summarizer
- ☑️ Translation

### Advanced Features

**Keyword Alerts** (Advanced tab):
1. Enable keyword monitoring
2. Add keywords (comma-separated): `developer, hiring, freelance`
3. Optional: Enable sound alerts
4. Optional: Set up WhatsApp notifications

**Background Scanner**:
- Automatically monitors LinkedIn feed
- Alerts you about matching posts
- Configurable scan interval (30-300 seconds)

## 📱 Usage

### Creating a Post

1. Go to LinkedIn home page
2. Click in the "Start a post" box
3. Look for the **ProRise AI** button
4. Enter your topic or prompt
5. Select tone and style
6. Click **Generate**
7. Review and edit
8. Post to LinkedIn

**Keyboard Shortcut**: `Ctrl+Shift+S`

### Commenting on Posts

1. Navigate to any LinkedIn post
2. Click the comment button
3. ProRise AI icon appears
4. Click for **5 smart suggestions**
5. Select and customize
6. Post your comment

### Replying to Messages

1. Open LinkedIn Messages
2. Click on any conversation
3. ProRise AI assistant appears
4. Get context-aware reply suggestions
5. One-click to use

### Rewriting Text

1. Select any text in a LinkedIn input field
2. Right-click or use `Ctrl+Shift+R`
3. Choose rewrite tone
4. AI enhances your text
5. Replace or keep original

## 🔐 Privacy & Security

### Data Handling
- ✅ **No Data Stored**: We don't store any of your content
- ✅ **Local Processing**: Settings stored on your device only
- ✅ **Your API Key**: You control your OpenAI account
- ✅ **Direct Connection**: Content sent directly to OpenAI
- ✅ **No Tracking**: We don't track your activity

### What Gets Sent to OpenAI
- Post content you want to generate
- Comments you want suggestions for
- Text you choose to rewrite
- **Nothing else** - no browsing history, personal data, or passwords

### Security Measures
- API key stored in Chrome's encrypted sync storage
- HTTPS-only connections
- Minimal permissions requested
- Open source code (auditable)

Read our full [Privacy Policy](PRIVACY_POLICY.md)

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Get AI suggestions |
| `Ctrl+Shift+R` | Rewrite selected text |

## 🛠️ Troubleshooting

### Extension Not Working

**Problem**: Extension icon appears but features don't work
- **Solution**: Make sure you've added your OpenAI API key in settings

**Problem**: "API key not configured" error
- **Solution**: Go to Settings → Add your OpenAI API key → Save

**Problem**: Features not appearing on LinkedIn
- **Solution**: Refresh the LinkedIn page (F5)

### API Key Issues

**Problem**: "Invalid API key" error
- **Solution**: Verify your key at https://platform.openai.com/api-keys
- Make sure there are no extra spaces
- Key should start with "sk-"

**Problem**: "Rate limit exceeded"
- **Solution**: You've used too many requests too quickly
- Wait a few minutes and try again
- Check your OpenAI usage dashboard

### Performance Issues

**Problem**: Slow generation
- **Solution**: This depends on OpenAI's API response time
- Usually takes 2-5 seconds
- Check your internet connection

**Problem**: Extension consuming too much memory
- **Solution**: Disable background scanner if not needed
- Disable features you don't use

## 📊 Usage Statistics

Track your AI-assisted activity in the extension popup:
- Posts Generated
- Comments Assisted
- Replies Generated
- Messages Replied
- Text Rewrites

View stats by:
- Today
- This Week
- This Month

## 🔄 Updates

### Version 3.3.6 (Current)
- ✅ Secure API key storage
- ✅ ProRise AI branding
- ✅ Improved UI/UX
- ✅ Chrome Web Store ready
- ✅ Privacy policy added

### Roadmap
- [ ] Chrome Web Store listing
- [ ] Export statistics feature
- [ ] More AI models support
- [ ] Content templates library
- [ ] Team collaboration features

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue with details
2. **Suggest Features**: Share your ideas
3. **Submit Pull Requests**: Fork, code, and PR
4. **Improve Docs**: Help make this README better

### Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/prorise-ai-linkedin.git

# Make your changes
# Test in Chrome (chrome://extensions/ → Load unpacked)

# Submit PR
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

- This extension is not affiliated with LinkedIn or OpenAI
- You are responsible for your OpenAI API usage and costs
- Use responsibly and follow LinkedIn's Terms of Service
- AI-generated content should be reviewed before posting

## 📞 Support

### Get Help
- **Email**: support@prioriseai.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/prorise-ai/issues)
- **Docs**: [Full Documentation](https://docs.prioriseai.com)

### Resources
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Privacy Policy](PRIVACY_POLICY.md)

## 🌟 Acknowledgments

- Built with ❤️ by the ProRise AI Team
- Powered by OpenAI's GPT models
- Inspired by the LinkedIn community
- Special thanks to all contributors

## 📈 Stats & Info

- **Extension Size**: ~500KB
- **Permissions**: Minimal (LinkedIn access only)
- **Performance**: Lightweight background service
- **Compatibility**: Chrome 88+, Edge 88+
- **Languages**: English (more coming soon)

---

**Made with 💚 by ProRise AI**

*Empowering professionals with AI-assisted LinkedIn presence*

[⬆ Back to top](#prorise-ai---linkedin-assistant-)
