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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                  className="px-4 py-1.5 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                >
                  登录
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  注册
                </button>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            💕 情感沟通模拟器
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            在安全的虚拟环境中，练习你的沟通技巧
          </p>
          <button
            onClick={() => router.push('/blog')}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 text-base font-medium bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full hover:from-amber-500 hover:to-orange-500 transition-all hover:shadow-lg hover:scale-105 active:scale-95"
          >
            📖 恋爱攻略
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s
                      ? 'bg-green-500 text-white'
                      : index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div
                    className={`w-8 h-1 mx-1 ${
                      index < currentStepIndex
                        ? 'bg-green-500'
                        : 'bg-slate-200 dark:bg-slate-700'
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
            <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
              选择你想要练习的场景
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {SCENES.map((scene) => (
                <Card
                  key={scene.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    selectedScene === scene.id
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
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
            <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
              选择伴侣的类型
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {PARTNERS.map((partner) => (
                <Card
                  key={partner.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    selectedPartner === partner.id
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
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
            <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
              选择TA的性别
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                  selectedGender === 'male'
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
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
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                  selectedGender === 'female'
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
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
            <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
              给TA起个名字
            </h2>
            <Card>
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={10}
                />
                <Button
                  onClick={handleNameSubmit}
                  disabled={!partnerName.trim()}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
                >
                  确认
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
            <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
              准备开始
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">场景</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {SCENES.find((s) => s.id === selectedScene)?.icon}{' '}
                    {SCENES.find((s) => s.id === selectedScene)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">伴侣</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {selectedGender === 'male' ? '👨' : '👩'}{' '}
                    {partnerName} ({PARTNERS.find((p) => p.id === selectedPartner)?.name}型)
                  </span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                  <p className="font-medium mb-1">💡 提示</p>
                  <p>
                    这是一个沉浸式体验，没有标准答案。请像真实对话一样，用心去沟通。
                    TA会根据你的话语做出真实的情绪反应。
                  </p>
                </div>
                <Button
                  onClick={handleStartGame}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-6"
                >
                  开始练习 💬
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
