import { SceneConfig, PartnerConfig, EmotionState, PartnerType, Gender } from './types';

// 场景配置
export const SCENES: SceneConfig[] = [
  {
    id: 'remedy',
    name: '事后挽回',
    description: '情绪上头说了重话，事后后悔，想要挽回',
    icon: '💔',
    startingContext: '你刚刚在争吵中说了很重的话，对方已经不再回复消息了。你想要道歉并挽回这段关系。',
  },
  {
    id: 'icebreaker',
    name: '冷战破冰',
    description: '吵架后双方冷战，不知道如何开口破冰',
    icon: '🧊',
    startingContext: '你们已经冷战三天了。对方一直不回复消息，你想要打破这个僵局。',
  },
  {
    id: 'preventive',
    name: '敏感话题',
    description: '需要讨论敏感话题（如钱、家务、未来），担心引发冲突',
    icon: '💬',
    startingContext: '你需要和对方讨论一个敏感话题，但又担心处理不当会引发争吵。',
  },
];

// 伴侣配置
export const PARTNERS: PartnerConfig[] = [
  {
    id: 'cold-war',
    name: '冷战型',
    description: '沉默、回避、不回应，需要耐心破冰',
    avatar: '👩',
    traits: ['沉默寡言', '回避冲突', '内心敏感', '需要安全感'],
    communicationStyle: '冷战型伴侣在冲突时倾向于沉默和回避，不直接表达情绪，但内心可能已经积累了大量委屈。需要耐心、温和地破冰，不要急于求成。',
  },
  {
    id: 'explosive',
    name: '爆发型',
    description: '情绪外放、指责、翻旧账，需要保持冷静',
    avatar: '👨',
    traits: ['情绪外放', '容易激动', '翻旧账', '需要被理解'],
    communicationStyle: '爆发型伴侣在冲突时会直接表达情绪，可能会指责和翻旧账。需要保持冷静，不要被情绪带跑，先认可对方的感受。',
  },
  {
    id: 'avoidant',
    name: '回避型',
    description: '转移话题、敷衍、逃避深层交流',
    avatar: '👧',
    traits: ['转移话题', '敷衍回应', '逃避深层交流', '害怕亲密'],
    communicationStyle: '回避型伴侣在面临深层交流时会转移话题或敷衍回应。需要循序渐进，不要过于强势，给予对方安全感。',
  },
];

// 微信表情包映射
export const WECHAT_STICKERS: Record<EmotionState, string[]> = {
  calm: ['😊', '🙂', '😌', '🤔'],
  upset: ['😢', '🥺', '😔', '😪'],
  angry: ['😤', '😡', '😠', '🤬'],
  sad: ['😭', '💔', '😢', '🥀'],
  reconciled: ['🥰', '😊', '❤️', '🤗'],
  broken: ['💔', '👋', '😶', '🔚'],
};

// 情绪阈值配置
export const EMOTION_THRESHOLDS = {
  // 愤怒值阈值
  anger: {
    calm: 20,
    upset: 40,
    angry: 60,
    broken: 90,
  },
  // 信任值阈值（反向）
  trust: {
    broken: 10,
    angry: 25,
    upset: 40,
    calm: 60,
    reconciled: 80,
  },
};

// 情绪回复延迟配置（毫秒）
export const EMOTION_DELAYS: Record<EmotionState, { min: number; max: number }> = {
  calm: { min: 1000, max: 3000 },
  upset: { min: 2000, max: 4000 },
  angry: { min: 500, max: 1500 },
  sad: { min: 3000, max: 6000 },
  reconciled: { min: 1000, max: 2000 },
  broken: { min: 5000, max: 8000 },
};

// 获取随机表情
export function getRandomSticker(emotion: EmotionState): string {
  const stickers = WECHAT_STICKERS[emotion];
  return stickers[Math.floor(Math.random() * stickers.length)];
}

// 根据情绪值判断当前情绪状态
export function calculateEmotionState(anger: number, trust: number): EmotionState {
  // 先判断是否已分手
  if (anger >= EMOTION_THRESHOLDS.anger.broken || trust <= EMOTION_THRESHOLDS.trust.broken) {
    return 'broken';
  }
  
  // 判断是否已和解
  if (anger <= 10 && trust >= EMOTION_THRESHOLDS.trust.reconciled) {
    return 'reconciled';
  }
  
  // 根据愤怒值和信任值综合判断
  if (anger >= EMOTION_THRESHOLDS.anger.angry) {
    return 'angry';
  }
  
  if (anger >= EMOTION_THRESHOLDS.anger.upset || trust <= EMOTION_THRESHOLDS.trust.upset) {
    return 'upset';
  }
  
  if (trust >= EMOTION_THRESHOLDS.trust.calm && anger <= EMOTION_THRESHOLDS.anger.calm) {
    return 'calm';
  }
  
  return 'upset';
}

// 计算消息对情绪的影响
export function calculateEmotionImpact(
  message: string,
  currentEmotion: EmotionState,
  partnerType: PartnerType
): { angerDelta: number; trustDelta: number } {
  // 基础分值
  let angerDelta = 0;
  let trustDelta = 0;
  
  // 积极关键词
  const positiveWords = ['对不起', '抱歉', '我错了', '原谅', '爱你', '在乎', '理解', '心疼', '以后', '改正', '珍惜', '对不起'];
  // 消极关键词
  const negativeWords = ['你总是', '你每次', '算了', '无所谓', '随便', '烦', '滚', '分手', '离婚', '受不了', '不可理喻'];
  // 中性但可能触发的话
  const triggerWords = ['但是', '可是', '不过', '你应该', '你应该', '你怎么不'];
  
  // 检测积极词汇
  for (const word of positiveWords) {
    if (message.includes(word)) {
      angerDelta -= 5;
      trustDelta += 5;
    }
  }
  
  // 检测消极词汇
  for (const word of negativeWords) {
    if (message.includes(word)) {
      angerDelta += 10;
      trustDelta -= 10;
    }
  }
  
  // 检测触发词
  for (const word of triggerWords) {
    if (message.includes(word)) {
      angerDelta += 3;
      trustDelta -= 2;
    }
  }
  
  // 根据伴侣类型调整
  switch (partnerType) {
    case 'cold-war':
      // 冷战型对强行追问更敏感
      if (message.includes('为什么不') || message.includes('你到底')) {
        angerDelta += 8;
        trustDelta -= 5;
      }
      break;
    case 'explosive':
      // 爆发型对反问和解释更敏感
      if (message.includes('我不是') || message.includes('你才')) {
        angerDelta += 10;
        trustDelta -= 8;
      }
      break;
    case 'avoidant':
      // 回避型对施压更敏感
      if (message.includes('必须') || message.includes('一定')) {
        angerDelta += 8;
        trustDelta -= 6;
      }
      break;
  }
  
  // 长消息通常更有诚意
  if (message.length > 50) {
    trustDelta += 2;
  }
  
  return { angerDelta, trustDelta };
}

// TTS 语音配置 - 根据性别选择声音
export const TTS_SPEAKERS: Record<Gender, string> = {
  male: 'zh_male_m191_uranus_bigtts',           // 云舟 - 男性声音
  female: 'zh_female_meilinvyou_saturn_bigtts', // 迷人女友 - 女性声音
};

// 性别语气风格
export const GENDER_STYLE: Record<Gender, { tone: string; behaviors: string[] }> = {
  male: {
    tone: '男性化语气：直接、简洁、不撒娇，表达情绪时偏内敛或直接',
    behaviors: ['不说"哼"、"呜呜"等撒娇用语', '多用短句', '生气时可能沉默或直接说重话', '伤心时语气低沉但不哭腔'],
  },
  female: {
    tone: '女性化语气：可以撒娇、表达细腻情感，情绪表达更丰富',
    behaviors: ['可以说"哼"、"呜呜"、"讨厌"等撒娇用语', '情绪表达更细腻', '生气时可能带情绪化表达', '伤心时可以带哭腔'],
  },
};

// TTS 情绪参数配置 - 根据情绪状态调整语速和音量
export interface TTSParams {
  speechRate: number;   // 语速: -50 到 100
  loudnessRate: number; // 音量: -50 到 100
}

export const EMOTION_TTS_PARAMS: Record<EmotionState, TTSParams> = {
  calm: {
    speechRate: 0,      // 正常语速
    loudnessRate: 0,    // 正常音量
  },
  upset: {
    speechRate: -10,    // 稍慢语速，表示委屈
    loudnessRate: -5,   // 稍低音量
  },
  angry: {
    speechRate: 20,     // 快语速，表示愤怒
    loudnessRate: 15,   // 较高音量
  },
  sad: {
    speechRate: -20,    // 慢语速，表示伤心
    loudnessRate: -10,  // 低音量
  },
  reconciled: {
    speechRate: 5,      // 温和语速
    loudnessRate: 0,    // 正常音量
  },
  broken: {
    speechRate: -30,    // 很慢语速，冷漠
    loudnessRate: -20,  // 很低音量
  },
};
