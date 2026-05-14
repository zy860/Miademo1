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
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f8] to-[#f5f3f0] dark:from-[#1a191b] dark:to-[#121212] flex items-center justify-center p-4 font-light">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-fall opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            >
              {['✨', '🤍', '🤎', '✨'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      <Card className="max-w-md w-full bg-white/80 dark:bg-stone-900/60 backdrop-blur-xl border border-stone-200/60 dark:border-stone-800/60 shadow-lg">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {status === 'success' ? (
            <>
              {/* Success */}
              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm border border-stone-200 dark:border-stone-700">✨</div>
              <h1 className="text-2xl font-light tracking-wide text-stone-800 dark:text-stone-100 mb-3">
                Connection Restored
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-[15px] leading-relaxed mb-8">
                You successfully navigated the emotional landscape.
                <br />
                {partnerName} feels heard and understood.
              </p>

              <div className="bg-stone-50/80 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800 rounded-2xl p-5 mb-8 text-left backdrop-blur-sm">
                <p className="text-[13px] text-stone-800 dark:text-stone-200 font-medium tracking-wide uppercase mb-3 opacity-80">
                  Reflections
                </p>
                <ul className="text-[14px] text-stone-600 dark:text-stone-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2"><span className="text-[#d4b5b0] mt-1">✦</span> Sincere apologies hold more weight than explanations.</li>
                  <li className="flex items-start gap-2"><span className="text-[#d4b5b0] mt-1">✦</span> Validating feelings is the first step to healing.</li>
                  <li className="flex items-start gap-2"><span className="text-[#d4b5b0] mt-1">✦</span> Empathy bridges the deepest gaps.</li>
                </ul>
              </div>

              <div className="text-stone-400 dark:text-stone-500 text-[13px] tracking-wide mb-8">
                Scenario: {scene.name} &nbsp;·&nbsp; Partner: {partner.name}
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleNewGame}
                  className="w-full bg-stone-800 hover:bg-stone-700 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 rounded-full font-medium py-6 shadow-sm transition-all"
                >
                  Explore New Journey
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full rounded-full py-6 font-medium border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-all"
                >
                  Experience Again
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Failed */}
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm">🤍</div>
              <h1 className="text-2xl font-light tracking-wide text-rose-900/80 dark:text-rose-200/80 mb-3">
                Connection Lost
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-[15px] leading-relaxed mb-8">
                {partnerName} chose to distance themselves...
                <br />
                Every challenge is an opportunity to learn.
              </p>

              <div className="bg-stone-50/80 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800 rounded-2xl p-5 mb-8 text-left backdrop-blur-sm">
                <p className="text-[13px] text-stone-800 dark:text-stone-200 font-medium tracking-wide uppercase mb-3 opacity-80">
                  Insights
                </p>
                <ul className="text-[14px] text-stone-600 dark:text-stone-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2"><span className="text-[#c3a49f] mt-1">✦</span> High emotions can cloud genuine intentions.</li>
                  <li className="flex items-start gap-2"><span className="text-[#c3a49f] mt-1">✦</span> Listening is often more powerful than speaking.</li>
                  <li className="flex items-start gap-2"><span className="text-[#c3a49f] mt-1">✦</span> Timing is crucial when offering an apology.</li>
                </ul>
              </div>

              <div className="text-stone-400 dark:text-stone-500 text-[13px] tracking-wide mb-8">
                Scenario: {scene.name} &nbsp;·&nbsp; Partner: {partner.name}
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-[#d4b5b0] hover:bg-[#c3a49f] text-white rounded-full font-medium py-6 shadow-sm transition-all"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleNewGame}
                  variant="outline"
                  className="w-full rounded-full py-6 font-medium border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-all"
                >
                  Choose New Scenario
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="fixed bottom-8 text-center text-stone-400 dark:text-stone-500 text-[13px] tracking-wide">
        <p>Every practice is a chance to grow.</p>
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
