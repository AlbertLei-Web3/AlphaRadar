import { useEffect, useState } from 'react';
import { ScoreResult } from '../modules/types';

export default function Home() {
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error running analysis:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Crypto News Analysis</h1>
      
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>

      <div className="mt-8">
        {results.map((result) => (
          <div key={result.newsItem.id} className="border p-4 mb-4 rounded">
            <h2 className="text-xl font-semibold">{result.newsItem.title}</h2>
            <p className="text-gray-600">{result.newsItem.source}</p>
            <p className="mt-2">{result.summary}</p>
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                Score: {result.finalScore}/100
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                Sentiment: {result.sentiment}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Credibility: {result.credibility}
              </span>
            </div>
            <div className="mt-2">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 