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
    return <div className="min-h-screen flex items-center justify-center font-light text-stone-500 tracking-wide">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#faf9f8] dark:bg-[#121212] p-4 md:p-8 font-light">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/')} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
            ← Home
          </Button>
          <div className="text-[15px] font-medium tracking-wide text-stone-800 dark:text-stone-200">
            {user?.username}'s Journey
          </div>
        </div>

        <Card className="bg-white/80 dark:bg-stone-900/60 backdrop-blur-xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-light tracking-wide text-stone-800 dark:text-stone-100">Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12 text-stone-400 dark:text-stone-500 text-[15px] tracking-wide">
                No journeys recorded yet. Time to explore.
              </div>
            ) : (
              <div className="space-y-4">
                {records.map(record => (
                  <div key={record.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white/50 dark:bg-stone-800/30 rounded-xl border border-stone-100 dark:border-stone-800/50 hover:shadow-sm transition-all relative overflow-hidden">
                    {/* Status Indicator Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${record.result === 'success' ? 'bg-[#d4b5b0]' : 'bg-stone-300 dark:bg-stone-600'}`} />
                    
                    <div className="space-y-1.5 pl-2">
                      <div className="font-medium text-[16px] flex items-center gap-3 text-stone-800 dark:text-stone-200 tracking-wide">
                        <span>{getSceneName(record.scenario)}</span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${record.result === 'success' ? 'bg-stone-100 text-[#d4b5b0] dark:bg-stone-800 dark:text-rose-300' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                          {record.result === 'success' ? 'Resolved' : 'Unresolved'}
                        </span>
                      </div>
                      <div className="text-[13px] text-stone-400 dark:text-stone-500">
                        {formatDate(record.played_at)}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right pr-2">
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Connection</div>
                      <div className={`text-xl font-light ${record.result === 'success' ? 'text-[#c3a49f] dark:text-rose-300' : 'text-stone-400 dark:text-stone-500'}`}>
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
