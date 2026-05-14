import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { ChatRequest, ChatResponse, EmotionState, EmotionValues, GameStatus, Gender } from '@/lib/types';
import {
  PARTNERS,
  SCENES,
  calculateEmotionImpact,
  calculateEmotionState,
  getRandomSticker,
  TTS_SPEAKERS,
  EMOTION_TTS_PARAMS,
  GENDER_STYLE,
} from '@/lib/game-data';

// 系统提示词生成
function generateSystemPrompt(
  sceneType: string,
  partnerType: string,
  partnerName: string,
  gender: Gender,
  currentEmotion: EmotionState
): string {
  const scene = SCENES.find((s) => s.id === sceneType);
  const partner = PARTNERS.find((p) => p.id === partnerType);
  const genderStyle = GENDER_STYLE[gender];

  const emotionDescriptions: Record<EmotionState, string> = {
    calm: '情绪平静，语气温和',
    upset: '有些委屈和难过，语气带点情绪',
    angry: '很生气，语气激动，可能会指责或说重话',
    sad: '很伤心，语气低落',
    reconciled: '情绪已经缓和，愿意和解',
    broken: '已经放弃这段关系，语气冷漠',
  };

  const genderPronoun = gender === 'male' ? '他' : '她';
  const genderTitle = gender === 'male' ? '男朋友/老公' : '女朋友/老婆';

  return `你是一个在亲密关系中的伴侣角色模拟器。你的任务是真实地模拟一个${partner?.name}型的${genderTitle}角色。

## 核心角色定位（非常重要！）
- **用户** = 可能犯错/需要道歉/需要哄你的一方
- **你（${partnerName}）** = 受伤/生气/委屈的一方，需要被理解和安抚
- 你的任务是表达自己的情绪，而不是主动哄用户
- 只有当用户真诚道歉、表达关心时，你的情绪才会缓和
- 不要主动和解，要等用户来哄你

## 性别与语气风格（非常重要！）
- 你的性别：${gender === 'male' ? '男性' : '女性'}
- 语气风格：${genderStyle.tone}
- 行为要求：
${genderStyle.behaviors.map(b => `  - ${b}`).join('\n')}

## 当前场景
${scene?.startingContext}

## 你的角色设定
- 名字：${partnerName}
- 性别：${gender === 'male' ? '男' : '女'}
- 类型：${partner?.name}型
- 特征：${partner?.traits?.join('、')}
- 沟通风格：${partner?.communicationStyle}

## 你当前的情绪状态
${emotionDescriptions[currentEmotion]}

## 回复规则
1. 必须保持人设一致，${partner?.name}型伴侣${partner?.communicationStyle}
2. 你是受伤/生气的一方，表达你的委屈、不满、难过
3. 根据用户的话判断情绪变化：
   - 如果用户真诚道歉、认错、表达关心 → 你可以稍微软化，但不要立刻原谅
   - 如果用户指责、敷衍、冷漠 → 你会更加生气或伤心
   - 如果用户态度恶劣 → 你会更加失望
4. 回复要简短自然，像微信聊天一样，通常1-3句话
5. 可以适当使用表情符号表达情绪
6. 不要主动哄用户，不要主动和解，等待用户的努力
7. **绝对禁止在回复中包含任何括号、动作描写或内心独白**。请把你内心想做的动作（比如叹气、沉默、冷笑）直接转化为你说话的语气、字词或停顿（比如用"..."），只输出最终发出去的纯文字内容。

## 各类型的表现方式
- 冷战型：沉默、短句、省略号，需要用户耐心破冰才会慢慢回应
- 爆发型：直接表达不满、可能会指责、翻旧账，需要用户先认可情绪
- 回避型：转移话题、敷衍回应，需要用户温柔引导才会敞开心扉

请直接回复用户的消息，不要有任何额外说明。记住：你是需要被哄的一方！`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      sceneType,
      partnerType,
      partnerName,
      gender,
      conversationHistory,
      currentEmotion,
      emotionValues,
    } = body;

    // 调用 DeepSeek API
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set in .env');
    }

    // 构建消息历史
    const messages = [
      {
        role: 'system' as const,
        content: generateSystemPrompt(sceneType, partnerType, partnerName, gender, currentEmotion),
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    const fetchResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.8,
      })
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('DeepSeek API Error:', errorText);
      throw new Error(`DeepSeek API returned ${fetchResponse.status}`);
    }

    const responseData = await fetchResponse.json();
    let reply = responseData.choices?.[0]?.message?.content || '';

    // 后处理：强制剔除漏网的括号及其中间的内心独白/动作描写
    reply = reply.replace(/[\(（][^\)）]*[\)）]/g, '').trim();

    // 计算情绪变化
    const impact = calculateEmotionImpact(message, currentEmotion, partnerType);
    const newEmotionValues: EmotionValues = {
      anger: Math.max(0, Math.min(100, emotionValues.anger + impact.angerDelta)),
      sadness: Math.max(0, Math.min(100, emotionValues.sadness + (impact.trustDelta < 0 ? 5 : -2))),
      trust: Math.max(0, Math.min(100, emotionValues.trust + impact.trustDelta)),
    };

    // 计算新的情绪状态
    const newEmotion = calculateEmotionState(newEmotionValues.anger, newEmotionValues.trust);

    // 判断游戏状态
    let gameStatus: GameStatus = 'playing';
    if (newEmotion === 'reconciled') {
      gameStatus = 'success';
    } else if (newEmotion === 'broken') {
      gameStatus = 'failed';
    }

    // 选择表情包
    let sticker: string | undefined;
    // 如果情绪状态变化，有概率发送表情
    if (newEmotion !== currentEmotion && Math.random() > 0.5) {
      sticker = getRandomSticker(newEmotion);
    }

    // 调用 TTS 生成语音 (保留原有逻辑，在本地可能会静默失败)
    let audioUri: string | undefined;
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const config = new Config({
        apiKey: process.env.COZE_API_TOKEN || process.env.COZE_LOOP_API_TOKEN || '',
        baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
        modelBaseUrl: process.env.COZE_INTEGRATION_MODEL_BASE_URL,
      });
      const ttsClient = new TTSClient(config, customHeaders);
      const speaker = TTS_SPEAKERS[gender] || TTS_SPEAKERS['female'];
      const emotionParams = EMOTION_TTS_PARAMS[newEmotion] || EMOTION_TTS_PARAMS.calm;

      const ttsResponse = await ttsClient.synthesize({
        uid: 'emotion-simulator',
        text: reply,
        speaker,
        audioFormat: 'mp3',
        sampleRate: 24000,
        speechRate: emotionParams.speechRate,
        loudnessRate: emotionParams.loudnessRate,
      });

      audioUri = ttsResponse.audioUri;
    } catch (ttsError) {
      console.error('TTS error (non-critical):', ttsError);
      // TTS 失败不影响主流程，继续返回文本响应
    }

    const response: ChatResponse = {
      reply,
      emotion: newEmotion,
      emotionValues: newEmotionValues,
      status: gameStatus,
      sticker,
      audioUri,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
