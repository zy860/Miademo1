'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { GameStatus, Gender } from '@/lib/types';
import { SCENES, PARTNERS } from '@/lib/game-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showConfetti, setShowConfetti] = useState(false);
  const hasRecorded = useRef(false);

  const status = searchParams.get('status') as GameStatus;
  const score = parseInt(searchParams.get('score') || '0', 10);
  const sceneType = searchParams.get('scene');
  const partnerType = searchParams.get('partner');
  const gender = (searchParams.get('gender') || 'female') as Gender;
  const partnerName = searchParams.get('name') || 'TA';

  const scene = SCENES.find((s) => s.id === sceneType);
  const partner = PARTNERS.find((p) => p.id === partnerType);

  useEffect(() => {
    if (status === 'success') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    if (!hasRecorded.current && sceneType && status) {
      hasRecorded.current = true;
      fetch('/api/game-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: sceneType,
          final_score: score,
          result: status,
        }),
      }).then(async (res) => {
        if (res.status === 401) {
          toast.info('登录后可保存您的游戏记录');
        } else if (res.ok) {
          toast.success('您的游戏记录已经保存');
        }
      }).catch(console.error);
    }
  }, [status, sceneType, score]);

  if (!scene || !partner) {
    router.push('/');
    return null;
  }

  const handleRetry = () => {
    const params = new URLSearchParams({
      scene: sceneType || '',
      partner: partnerType || '',
      gender: gender,
      name: partnerName,
    });
    router.push(`/chat?${params.toString()}`);
  };

  const handleNewGame = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['❤️', '🎉', '💕', '✨', '💖'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          {status === 'success' ? (
            <>
              {/* Success */}
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                和解成功！
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                恭喜你成功化解了这次冲突！
                <br />
                {partnerName}原谅了你，你们的关系更进一步了 💕
              </p>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                  💡 这次沟通的收获
                </p>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• 真诚的道歉比解释更有力量</li>
                  <li>• 认可对方的感受是和解的第一步</li>
                  <li>• 承诺改变需要具体的行动</li>
                </ul>
              </div>

              <div className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                场景：{scene.icon} {scene.name} · 伴侣：{partner.avatar} {partner.name}型
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleNewGame}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  尝试其他场景 🎮
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  再练习一次
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Failed */}
              <div className="text-6xl mb-4">💔</div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                关系破裂
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                很遗憾，{partnerName}选择了离开...
                <br />
                也许下次可以尝试不同的沟通方式。
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                  💡 可能的问题
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• 情绪过于激动，说了伤人的话</li>
                  <li>• 没有认真倾听对方的感受</li>
                  <li>• 道歉不够真诚或时机不对</li>
                </ul>
              </div>

              <div className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                场景：{scene.icon} {scene.name} · 伴侣：{partner.avatar} {partner.name}型
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  重新尝试 🔄
                </Button>
                <Button
                  onClick={handleNewGame}
                  variant="outline"
                  className="w-full"
                >
                  选择其他场景
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="fixed bottom-4 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>每一次练习，都是成长的机会 ❤️</p>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}
