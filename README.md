# Reel Recap - Video Transcript Extractor

A modern web application that extracts transcripts from YouTube, TikTok, Instagram Reels, and Twitter videos, then generates AI-powered summaries in multiple languages.

## ✨ Features

- **Multi-Platform Support**: Extract transcripts from YouTube, TikTok, Instagram, and Twitter/X videos
- **AI Summarization**: Generate intelligent summaries using DeepSeek AI
- **Multi-Language Support**: Summaries available in 10+ languages (English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese)
- **Dark/Light Mode**: Beautiful responsive design with theme switching
- **Copy Functionality**: Easy copy-to-clipboard for transcripts and summaries
- **Real-time Processing**: Fast transcript extraction and summarization
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Lucide React icons
- **Theme**: next-themes for dark/light mode
- **APIs**: Supadata for transcript extraction, DeepSeek for AI summarization

## 📋 Prerequisites

Before running this application, you need to obtain API keys from:

1. **Supadata API**: Sign up at [dash.supadata.ai](https://dash.supadata.ai/) for video transcript extraction
2. **DeepSeek API**: Get your API key from [api-docs.deepseek.com](https://api-docs.deepseek.com/) for AI summarization

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd reel_recap
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   SUPADATA_API_KEY=your_supadata_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Enter a video URL**: Paste a YouTube, TikTok, Instagram, or Twitter video URL
2. **Extract Transcript**: Click "Extract Transcript" to get the video's text content
3. **Generate Summary**: Select your preferred language and click "Generate Summary"
4. **Copy Content**: Use the copy buttons to save transcripts or summaries
5. **Toggle Theme**: Switch between dark and light modes using the theme toggle

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── transcript/route.ts    # Transcript extraction API
│   │   └── summarize/route.ts     # AI summarization API
│   ├── layout.tsx                 # Root layout with theme provider
│   └── page.tsx                   # Main application page
├── components/
│   ├── VideoUrlInput.tsx          # URL input and validation
│   ├── TranscriptDisplay.tsx      # Transcript display component
│   ├── SummarySection.tsx         # Summary generation and display
│   ├── ThemeProvider.tsx          # Theme context provider
│   └── ThemeToggle.tsx            # Dark/light mode toggle
└── store/
    └── useStore.ts                # Zustand state management
```

## 🔧 API Endpoints

### POST `/api/transcript`
Extracts transcript from video URLs.

**Request Body**:
```json
{
  "url": "https://youtube.com/watch?v=..."
}
```

**Response**:
```json
{
  "success": true,
  "transcript": [
    {
      "text": "Hello world",
      "duration": 2.5,
      "offset": 0
    }
  ]
}
```

### POST `/api/summarize`
Generates AI summary of transcript.

**Request Body**:
```json
{
  "transcript": "Full transcript text...",
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "summary": "AI-generated summary..."
}
```

## 🌍 Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Vercel**: Import your project at [vercel.com](https://vercel.com)
3. **Add Environment Variables**: In Vercel dashboard, add your API keys
4. **Deploy**: Vercel will automatically build and deploy your application

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|---------|
| `SUPADATA_API_KEY` | API key for Supadata transcript service | Yes |
| `DEEPSEEK_API_KEY` | API key for DeepSeek AI summarization | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supadata](https://supadata.ai/) for video transcript extraction
- [DeepSeek](https://deepseek.com/) for AI-powered summarization
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for beautiful icons
