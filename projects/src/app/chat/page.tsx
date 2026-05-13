'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Message, EmotionState, EmotionValues, SceneType, PartnerType, GameStatus, Gender } from '@/lib/types';
import { SCENES, PARTNERS, EMOTION_DELAYS, getRandomSticker } from '@/lib/game-data';
import { Button } from '@/components/ui/button';

// 扩展 Message 类型添加音频 URL
interface ChatMessage extends Message {
  audioUri?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [emotionValues, setEmotionValues] = useState<EmotionValues>({
    anger: 40,
    sadness: 30,
    trust: 50,
  });
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>('upset');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [showSticker, setShowSticker] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // 从URL获取参数
  const sceneType = searchParams.get('scene') as SceneType;
  const partnerType = searchParams.get('partner') as PartnerType;
  const gender = (searchParams.get('gender') || 'female') as Gender;
  const partnerName = searchParams.get('name') || 'TA';

  const scene = SCENES.find((s) => s.id === sceneType);
  const partner = PARTNERS.find((p) => p.id === partnerType);

  // 初始化场景
  useEffect(() => {
    if (!scene || !partner) {
      router.push('/');
      return;
    }

    // 根据场景类型设置初始情绪值
    let initialAnger = 40;
    let initialTrust = 50;

    switch (sceneType) {
      case 'remedy':
        initialAnger = 60;
        initialTrust = 30;
        break;
      case 'icebreaker':
        initialAnger = 50;
        initialTrust = 40;
        break;
      case 'preventive':
        initialAnger = 20;
        initialTrust = 60;
        break;
    }

    setEmotionValues({
      anger: initialAnger,
      sadness: 30,
      trust: initialTrust,
    });

    // 发送初始消息
    const initialMessages = getInitialMessages(sceneType, partnerType, partnerName);
    setTimeout(() => {
      setMessages(initialMessages);
    }, 500);
  }, [scene, partner, sceneType, partnerType, partnerName, router]);

  // 获取初始消息
  const getInitialMessages = (scene: SceneType, partner: PartnerType, name: string): ChatMessage[] => {
    const greetings: Record<SceneType, Record<PartnerType, string>> = {
      remedy: {
        'cold-war': '……',
        'explosive': '你还知道找我？我还在气头上！',
        'avoidant': '哦……',
      },
      icebreaker: {
        'cold-war': '……',
        'explosive': '三天了！你知道三天不联系我是什么感觉吗？！',
        'avoidant': '嗯……怎么了？',
      },
      preventive: {
        'cold-war': '……你说。',
        'explosive': '有什么事就说吧。',
        'avoidant': '嗯？什么事呀……',
      },
    };

    return [
      {
        id: '1',
        role: 'assistant',
        content: greetings[scene][partner],
        timestamp: new Date(),
        emotion: currentEmotion,
      },
    ];
  };

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 播放音频
  const playAudio = (audioUri: string, messageId: string) => {
    // 停止当前播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 创建新的音频实例
    const audio = new Audio(audioUri);
    audioRef.current = audio;

    audio.onplay = () => {
      setPlayingMessageId(messageId);
    };

    audio.onended = () => {
      setPlayingMessageId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setPlayingMessageId(null);
    };

    audio.play().catch((error) => {
      console.error('Failed to play audio:', error);
      setPlayingMessageId(null);
    });
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || status !== 'playing' || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 调用后端API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sceneType,
          partnerType,
          partnerName,
          gender,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentEmotion,
          emotionValues,
        }),
      });

      const data = await response.json();

      // 模拟打字延迟
      const emotionDelay = EMOTION_DELAYS[data.emotion as EmotionState] || EMOTION_DELAYS.calm;
      const typingDelay = Math.random() * (emotionDelay.max - emotionDelay.min) + emotionDelay.min;

      await new Promise((resolve) => setTimeout(resolve, typingDelay));

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        emotion: data.emotion,
        sticker: data.sticker,
        audioUri: data.audioUri,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setEmotionValues(data.emotionValues);
      setCurrentEmotion(data.emotion);
      setStatus(data.status);

      // 自动播放语音
      if (data.audioUri && autoPlayEnabled) {
        playAudio(data.audioUri, aiMessage.id);
      }

      // 显示表情包
      if (data.sticker) {
        setShowSticker(data.sticker);
        setTimeout(() => setShowSticker(null), 2000);
      }

      // 检查游戏状态
      if (data.status === 'success' || data.status === 'failed') {
        setTimeout(() => {
          router.push(
            `/result?status=${data.status}&scene=${sceneType}&partner=${partnerType}&gender=${gender}&name=${partnerName}&score=${data.emotionValues.trust}`
          );
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!scene || !partner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* 隐藏的音频元素 */}
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mr-3"
          >
            ←
          </button>
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-xl">
              {gender === 'male' ? '👨' : '👩'}
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-800 dark:text-white">{partnerName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isTyping ? '正在输入...' : playingMessageId ? '🔊 正在播放...' : '在线'}
              </div>
            </div>
          </div>
          {/* 自动播放开关 */}
          <button
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            className={`text-sm px-2 py-1 rounded ${
              autoPlayEnabled
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {autoPlayEnabled ? '🔊 自动' : '🔇 静音'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {/* Scene hint */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 inline-block mx-auto w-full">
            {scene.icon} {scene.name} · {partner.name}型
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm mr-2 shrink-0">
                  {gender === 'male' ? '👨' : '👩'}
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.sticker && (
                  <div className="text-2xl mt-1">{message.sticker}</div>
                )}
                {/* AI消息显示播放按钮 */}
                {message.role === 'assistant' && message.audioUri && (
                  <button
                    onClick={() => playAudio(message.audioUri!, message.id)}
                    className={`mt-2 text-xs flex items-center gap-1 ${
                      playingMessageId === message.id
                        ? 'text-green-500 animate-pulse'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={playingMessageId === message.id}
                  >
                    {playingMessageId === message.id ? (
                      <>
                        <span className="inline-block w-3 h-3">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        </span>
                        播放中...
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-3 h-3">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                        播放语音
                      </>
                    )}
                  </button>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm ml-2 shrink-0">
                  我
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm mr-2 shrink-0">
                {gender === 'male' ? '👨' : '👩'}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticker overlay */}
      {showSticker && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="text-8xl animate-bounce">{showSticker}</div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              disabled={status !== 'playing' || isTyping}
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || status !== 'playing' || isTyping}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 disabled:opacity-50"
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
