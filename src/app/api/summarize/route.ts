import { NextRequest, NextResponse } from 'next/server';

interface SummarizeRequest {
  transcript: string;
  language: string;
}

interface SummarizeResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

// Language prompts for different summary languages
const getLanguagePrompt = (language: string): string => {
  const prompts = {
    en: 'Please provide a concise summary of the following video transcript in English:',
    es: 'Por favor, proporciona un resumen conciso de la siguiente transcripción de video en español:',
    fr: 'Veuillez fournir un résumé concis de la transcription vidéo suivante en français:',
    de: 'Bitte erstellen Sie eine prägnante Zusammenfassung des folgenden Video-Transkripts auf Deutsch:',
    it: 'Si prega di fornire un riassunto conciso della seguente trascrizione video in italiano:',
    pt: 'Por favor, forneça um resumo conciso da seguinte transcrição de vídeo em português:',
    ru: 'Пожалуйста, предоставьте краткое изложение следующей видео транскрипции на русском языке:',
    ja: '以下の動画の文字起こしの簡潔な要約を日本語で提供してください：',
    ko: '다음 비디오 대본의 간결한 요약을 한국어로 제공해 주세요:',
    zh: '请用中文提供以下视频转录的简洁摘要：'
  };
  
  return prompts[language as keyof typeof prompts] || prompts.en;
};

export async function POST(request: NextRequest): Promise<NextResponse<SummarizeResponse>> {
  try {
    const { transcript, language = 'en' }: SummarizeRequest = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'Transcript is required' },
        { status: 400 }
      );
    }

    if (transcript.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transcript cannot be empty' },
        { status: 400 }
      );
    }

    // Check for DeepSeek API key
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return NextResponse.json(
        { success: false, error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    // Prepare the prompt
    const languagePrompt = getLanguagePrompt(language);
    const systemPrompt = `You are an AI assistant that creates concise, informative summaries of video content. Focus on the main points, key insights, and important details. Keep the summary clear and well-structured.`;
    const userPrompt = `${languagePrompt}\n\n${transcript}`;

    // Call DeepSeek API (OpenAI-compatible format)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API error:', errorData);
      
      return NextResponse.json(
        { success: false, error: 'Failed to generate summary. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No summary generated' },
        { status: 500 }
      );
    }

    const summary = data.choices[0].message?.content?.trim();
    
    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Empty summary generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error: unknown) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'Summarization API endpoint. Use POST method with transcript and language.' },
    { status: 200 }
  );
}