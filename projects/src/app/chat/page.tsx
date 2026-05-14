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
    <div className="min-h-screen bg-[#faf9f8] dark:bg-[#121212] flex flex-col font-light">
      {/* 隐藏的音频元素 */}
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.push('/')}
            className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 mr-3 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xl shadow-sm">
              {gender === 'male' ? '👨' : '👩'}
            </div>
            <div className="ml-3">
              <div className="font-medium text-stone-800 dark:text-stone-100 tracking-wide">{partnerName}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {isTyping ? '正在输入...' : playingMessageId ? '🔊 正在播放...' : 'Online'}
              </div>
            </div>
          </div>
          {/* 自动播放开关 */}
          <button
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all border ${
              autoPlayEnabled
                ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-200 dark:text-stone-900 dark:border-stone-200'
                : 'bg-transparent text-stone-500 border-stone-300 dark:border-stone-700'
            }`}
          >
            {autoPlayEnabled ? 'Auto-play' : 'Muted'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Scene hint */}
          <div className="text-center text-xs text-stone-500 dark:text-stone-400 bg-stone-200/50 dark:bg-stone-800/50 rounded-full px-4 py-1.5 inline-block mx-auto max-w-[80%] backdrop-blur-sm border border-stone-200/50 dark:border-stone-700/50">
            {scene.icon} {scene.name} · {partner.name}型
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-sm mr-3 shrink-0 shadow-sm">
                  {gender === 'male' ? '👨' : '👩'}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-tr-sm'
                    : 'bg-white/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 backdrop-blur-md border border-stone-200/60 dark:border-stone-700/60 rounded-tl-sm'
                }`}
              >
                <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.sticker && (
                  <div className="text-3xl mt-2">{message.sticker}</div>
                )}
                {/* AI消息显示播放按钮 */}
                {message.role === 'assistant' && message.audioUri && (
                  <button
                    onClick={() => playAudio(message.audioUri!, message.id)}
                    className={`mt-2 text-xs flex items-center gap-1.5 transition-colors ${
                      playingMessageId === message.id
                        ? 'text-stone-800 dark:text-stone-200 animate-pulse'
                        : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
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
                        Play Voice
                      </>
                    )}
                  </button>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#d4b5b0] dark:bg-rose-900/50 flex items-center justify-center text-white dark:text-rose-200 text-xs ml-3 shrink-0 shadow-sm border border-[#c3a49f] dark:border-rose-800">
                  Me
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-sm mr-3 shrink-0 shadow-sm">
                {gender === 'male' ? '👨' : '👩'}
              </div>
              <div className="bg-white/90 dark:bg-stone-800/90 backdrop-blur-md border border-stone-200/60 dark:border-stone-700/60 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                <div className="flex space-x-1.5 items-center h-full">
                  <div className="w-1.5 h-1.5 bg-stone-400/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-stone-400/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-stone-400/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className="bg-transparent sticky bottom-0 pb-6 pt-2 pointer-events-none">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center gap-2 p-2 bg-white/80 dark:bg-stone-800/80 backdrop-blur-xl border border-stone-200/80 dark:border-stone-700/80 shadow-lg rounded-full pointer-events-auto">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Say something..."
              disabled={status !== 'playing' || isTyping}
              className="flex-1 px-4 py-2 bg-transparent text-stone-800 dark:text-stone-100 focus:outline-none disabled:opacity-50 font-light placeholder:text-stone-400"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || status !== 'playing' || isTyping}
              className="bg-stone-800 hover:bg-stone-700 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 rounded-full px-6 py-2 disabled:opacity-50 transition-all font-medium"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
