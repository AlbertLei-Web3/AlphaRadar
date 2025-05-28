# AlphaRadar - AI-Powered Sentiment Radar

An AI-powered sentiment radar for meme trends, market signals and alpha leaks. This platform analyzes crypto news and social signals using OpenAI's GPT model to provide real-time insights and scoring.

## Features

- Fetches news from multiple crypto RSS feeds
- Cleans and processes news content
- Analyzes articles using OpenAI's GPT model
- Calculates sentiment and credibility scores
- Provides a simple web interface to view results

## Tech Stack

- Next.js
- TypeScript
- OpenAI API
- RSS Parser
- Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/src
  /modules
    - fetchNews.ts      # News fetching module
    - cleanData.ts      # Text cleaning module
    - analyzeWithAI.ts  # OpenAI analysis module
    - scoreEngine.ts    # Scoring module
    - pushResult.ts     # Result display module
    - types.ts          # Type definitions
  /pipeline
    - runAnalysis.ts    # Main analysis pipeline
  /pages
    - index.tsx         # Main UI
    - api/analyze.ts    # API endpoint
  /utils
    - config.ts         # Configuration
```

## Future Improvements

- Add support for Twitter and Discord sources
- Implement user preferences and custom scoring rules
- Add real-time notifications
- Support multiple AI models
- Add user authentication and saved preferences
- Implement a more sophisticated scoring algorithm

## License

MIT 