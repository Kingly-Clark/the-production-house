import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SummarizeInput {
  url: string;
  title: string;
  description: string;
}

export async function summarizeWebsite(input: SummarizeInput): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Based on the following website information, write a concise 2-3 sentence business summary that could be used as a brand description on a content syndication platform.

Website Title: ${input.title}
Website URL: ${input.url}
Meta Description: ${input.description}

Please provide a professional, clear summary that describes what this business does and its value proposition. The summary should be suitable for a content syndication platform.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to summarize website: ${message}`);
  }
}
