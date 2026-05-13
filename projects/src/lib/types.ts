// 场景类型
export type SceneType = 'remedy' | 'icebreaker' | 'preventive';

// 伴侣类型
export type PartnerType = 'cold-war' | 'explosive' | 'avoidant';

// 性别
export type Gender = 'male' | 'female';

// 情绪状态
export type EmotionState = 'calm' | 'upset' | 'angry' | 'sad' | 'reconciled' | 'broken';

// 游戏状态
export type GameStatus = 'playing' | 'success' | 'failed';

// 场景配置
export interface SceneConfig {
  id: SceneType;
  name: string;
  description: string;
  icon: string;
  startingContext: string;
}

// 伴侣配置
export interface PartnerConfig {
  id: PartnerType;
  name: string;
  description: string;
  avatar: string;
  traits: string[];
  communicationStyle: string;
}

// 情绪数值
export interface EmotionValues {
  anger: number;    // 愤怒值 0-100
  sadness: number;  // 委屈值 0-100
  trust: number;    // 信任值 0-100
}

// 消息
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: EmotionState;
  sticker?: string;
  isTyping?: boolean;
}

// 游戏会话
export interface GameSession {
  sceneType: SceneType;
  partnerType: PartnerType;
  partnerName: string;
  gender: Gender;
  messages: Message[];
  emotionValues: EmotionValues;
  currentEmotion: EmotionState;
  status: GameStatus;
  turnCount: number;
}

// API 请求
export interface ChatRequest {
  message: string;
  sceneType: SceneType;
  partnerType: PartnerType;
  partnerName: string;
  gender: Gender;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  currentEmotion: EmotionState;
  emotionValues: EmotionValues;
}

// API 响应
export interface ChatResponse {
  reply: string;
  emotion: EmotionState;
  emotionValues: EmotionValues;
  status: GameStatus;
  sticker?: string;
  audioUri?: string;  // TTS 音频 URL
}

// 博客文章
export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  content: string;
  icon: string;
  tag: string;
}
