'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SCENES } from '@/lib/game-data';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{username: string} | null>(null);

  useEffect(() => {
    // 1. 获取用户信息
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login?redirect=/profile');
          return;
        }
        setUser(data.user);
        
        // 2. 获取游戏记录
        return fetch('/api/game-records');
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.records) {
          setRecords(data.records);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  const getSceneName = (scenarioId: string) => {
    const scene = SCENES.find(s => s.id === scenarioId);
    return scene ? `${scene.icon} ${scene.name}` : scenarioId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/')}>
            ← 返回首页
          </Button>
          <div className="text-lg font-medium">
            👤 {user?.username} 的个人主页
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>游戏记录</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                暂无游戏记录，快去尝试一下吧！
              </div>
            ) : (
              <div className="space-y-4">
                {records.map(record => (
                  <div key={record.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
                    <div className="space-y-1">
                      <div className="font-medium text-lg flex items-center gap-2">
                        <span>{getSceneName(record.scenario)}</span>
                        <span className={`text-sm px-2 py-0.5 rounded-full ${record.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {record.result === 'success' ? '通关成功' : '遗憾离场'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        游玩时间：{formatDate(record.played_at)}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <div className="text-sm text-slate-500">最终好感度</div>
                      <div className={`text-xl font-bold ${record.result === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {record.final_score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
