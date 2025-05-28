import type { NextApiRequest, NextApiResponse } from 'next';
import { runAnalysis } from '../../pipeline/runAnalysis';
import { ScoreResult } from '../../modules/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScoreResult[]>
) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    await runAnalysis();
    // TODO: Return actual results from the pipeline
    res.status(200).json([]);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).end();
  }
} 