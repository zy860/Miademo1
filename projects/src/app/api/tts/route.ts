import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { EmotionState, Gender } from '@/lib/types';
import { TTS_SPEAKERS, EMOTION_TTS_PARAMS } from '@/lib/game-data';

interface TTSRequest {
  text: string;
  emotion: EmotionState;
  gender: Gender;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, emotion, gender } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 TTS 客户端
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 获取语音参数
    const speaker = TTS_SPEAKERS[gender] || TTS_SPEAKERS['female'];
    const emotionParams = EMOTION_TTS_PARAMS[emotion] || EMOTION_TTS_PARAMS.calm;

    // 调用 TTS
    const response = await client.synthesize({
      uid: 'emotion-simulator',
      text,
      speaker,
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate: emotionParams.speechRate,
      loudnessRate: emotionParams.loudnessRate,
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}
