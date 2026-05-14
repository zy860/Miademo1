'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SCENES, PARTNERS } from '@/lib/game-data';
import { SceneType, PartnerType, Gender } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserInfo {
  id: number;
  username: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerType | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [step, setStep] = useState<'scene' | 'partner' | 'gender' | 'name' | 'confirm'>('scene');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.refresh();
  };

  const handleSceneSelect = (sceneId: SceneType) => {
    setSelectedScene(sceneId);
    setStep('partner');
  };

  const handlePartnerSelect = (partnerId: PartnerType) => {
    setSelectedPartner(partnerId);
    setStep('gender');
  };

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
    setStep('name');
  };

  const handleNameSubmit = () => {
    if (partnerName.trim()) {
      setStep('confirm');
    }
  };

  const handleStartGame = () => {
    if (selectedScene && selectedPartner && selectedGender && partnerName.trim()) {
      const params = new URLSearchParams({
        scene: selectedScene,
        partner: selectedPartner,
        gender: selectedGender,
        name: partnerName.trim(),
      });
      router.push(`/chat?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (step === 'partner') {
      setStep('scene');
      setSelectedScene(null);
    } else if (step === 'gender') {
      setStep('partner');
      setSelectedPartner(null);
    } else if (step === 'name') {
      setStep('gender');
      setSelectedGender(null);
    } else if (step === 'confirm') {
      setStep('name');
    }
  };

  const steps = ['scene', 'partner', 'gender', 'name', 'confirm'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f8] to-[#f5f3f0] dark:from-[#1a191b] dark:to-[#121212] font-light">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          {/* 用户状态栏 */}
          <div className="flex justify-end items-center gap-3 mb-4">
            {checkingAuth ? (
              <span className="text-sm text-slate-400">加载中...</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/profile')}
                  className="text-sm text-slate-600 dark:text-slate-300 hover:text-green-500 transition-colors"
                >
                  👤 {user.username}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-1.5 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-5 py-1.5 text-sm bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-full hover:bg-stone-700 dark:hover:bg-white transition-all shadow-sm"
                >
                  Join
                </button>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-light tracking-tight text-stone-800 dark:text-stone-100 mb-3">
            SoulSync
          </h1>
          <p className="text-stone-500 dark:text-stone-400 font-light tracking-wide text-sm mb-8">
            The intimate space to practice emotional communication
          </p>
          <button
            onClick={() => router.push('/blog')}
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium bg-white/80 dark:bg-white/10 backdrop-blur-md border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-200 rounded-full hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            Explore Articles
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs tracking-wider transition-colors border ${
                    step === s
                      ? 'bg-stone-800 border-stone-800 text-white dark:bg-stone-200 dark:border-stone-200 dark:text-stone-900 shadow-sm'
                      : index < currentStepIndex
                      ? 'bg-stone-800 border-stone-800 text-white dark:bg-stone-200 dark:border-stone-200 dark:text-stone-900'
                      : 'bg-transparent border-stone-300 text-stone-400 dark:border-stone-700'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div
                    className={`w-10 h-[1px] mx-2 ${
                      index < currentStepIndex
                        ? 'bg-stone-800 dark:bg-stone-200'
                        : 'bg-stone-200 dark:bg-stone-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step: Scene Selection */}
        {step === 'scene' && (
          <div className="space-y-4">
            <h2 className="text-xl font-light tracking-wide text-center text-stone-800 dark:text-stone-200 mb-8">
              Select a scenario
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {SCENES.map((scene) => (
                <Card
                  key={scene.id}
                  className={`cursor-pointer transition-all duration-300 border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm ${
                    selectedScene === scene.id
                      ? 'ring-1 ring-stone-800 dark:ring-stone-300 shadow-md transform -translate-y-1'
                      : 'hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                  onClick={() => handleSceneSelect(scene.id)}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{scene.icon}</div>
                    <CardTitle className="text-lg">{scene.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {scene.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Partner Selection */}
        {step === 'partner' && (
          <div className="space-y-4">
            <button
              onClick={handleBack}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              ← 返回
            </button>
            <h2 className="text-xl font-light tracking-wide text-center text-stone-800 dark:text-stone-200 mb-8">
              Choose personality
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {PARTNERS.map((partner) => (
                <Card
                  key={partner.id}
                  className={`cursor-pointer transition-all duration-300 border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm ${
                    selectedPartner === partner.id
                      ? 'ring-1 ring-stone-800 dark:ring-stone-300 shadow-md transform -translate-y-1'
                      : 'hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                  onClick={() => handlePartnerSelect(partner.id)}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center mb-3">
                      {partner.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {partner.traits.map((trait) => (
                        <span
                          key={trait}
                          className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Gender Selection */}
        {step === 'gender' && (
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={handleBack}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              ← 返回
            </button>
            <h2 className="text-xl font-light tracking-wide text-center text-stone-800 dark:text-stone-200 mb-8">
              Select Gender
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card
                className={`cursor-pointer transition-all duration-300 border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm ${
                  selectedGender === 'male'
                    ? 'ring-1 ring-stone-800 dark:ring-stone-300 shadow-md transform -translate-y-1'
                    : 'hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-700'
                }`}
                onClick={() => handleGenderSelect('male')}
              >
                <CardHeader className="text-center">
                  <div className="text-5xl mb-2">👨</div>
                  <CardTitle className="text-lg">男性</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    男性化语气：直接、简洁、不撒娇
                  </CardDescription>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all duration-300 border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm ${
                  selectedGender === 'female'
                    ? 'ring-1 ring-stone-800 dark:ring-stone-300 shadow-md transform -translate-y-1'
                    : 'hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-700'
                }`}
                onClick={() => handleGenderSelect('female')}
              >
                <CardHeader className="text-center">
                  <div className="text-5xl mb-2">👩</div>
                  <CardTitle className="text-lg">女性</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    女性化语气：可以撒娇、表达细腻情感
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Name Input */}
        {step === 'name' && (
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={handleBack}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              ← 返回
            </button>
            <h2 className="text-xl font-light tracking-wide text-center text-stone-800 dark:text-stone-200 mb-8">
              Name your partner
            </h2>
            <Card className="border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <span className="text-5xl">
                    {selectedGender === 'male' ? '👨' : '👩'}
                  </span>
                </div>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="请输入对方的名字..."
                  className="w-full px-4 py-3 rounded-lg border border-stone-200/80 dark:border-stone-700 bg-white/80 dark:bg-stone-800/50 text-stone-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-800 transition-all font-light"
                  maxLength={10}
                />
                <Button
                  onClick={handleNameSubmit}
                  disabled={!partnerName.trim()}
                  className="w-full mt-6 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white rounded-full font-medium transition-all"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={handleBack}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              ← 返回
            </button>
            <h2 className="text-xl font-light tracking-wide text-center text-stone-800 dark:text-stone-200 mb-8">
              Ready to begin
            </h2>
            <Card className="border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-700/50">
                  <span className="text-stone-500 dark:text-stone-400 font-light">Scenario</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {SCENES.find((s) => s.id === selectedScene)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-700/50">
                  <span className="text-stone-500 dark:text-stone-400 font-light">Partner</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {partnerName} · {PARTNERS.find((p) => p.id === selectedPartner)?.name}
                  </span>
                </div>
                <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg text-rose-900/70 dark:text-rose-200/70 text-sm font-light leading-relaxed border border-rose-100/50 dark:border-rose-900/20">
                  Immerse yourself in the conversation. Respond naturally, and observe how your words shape their emotions.
                </div>
                <Button
                  onClick={handleStartGame}
                  className="w-full bg-[#d4b5b0] hover:bg-[#c3a49f] dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-base py-6 rounded-full font-medium transition-all shadow-sm"
                >
                  Start Experience
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 dark:text-slate-400 text-sm">
          <p>通过模拟练习，提升你的沟通能力 ❤️</p>
        </div>
      </div>
    </div>
  );
}
