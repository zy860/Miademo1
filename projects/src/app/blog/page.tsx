'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogPostListItem {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

const TAGS: Record<string, string> = {
  '吵架': '吵架应对',
  '道歉': '道歉技巧',
  '回复': '沟通雷区',
  '沟通': '沟通技巧',
  '冷战': '冷战破冰',
  '情绪': '情绪管理',
};

function getTag(title: string): string {
  for (const [key, value] of Object.entries(TAGS)) {
    if (title.includes(key)) return value;
  }
  return '恋爱攻略';
}

const ICONS: Record<string, string> = {
  '吵架': '⏰',
  '回复': '🤦',
  '道歉': '🙏',
  '冷战': '🧊',
  '情绪': '💭',
  '沟通': '💡',
};

function getIcon(title: string): string {
  for (const [key, value] of Object.entries(ICONS)) {
    if (title.includes(key)) return value;
  }
  return '📖';
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPosts = () => {
    fetch('/api/blog')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) {
          setPosts(data.posts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/blog/generate', { method: 'POST' });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch {
      console.error('生成文章失败');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            ← 返回首页
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            📖 恋爱攻略
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            那些没人教你的沟通技巧，我们帮你总结好了
          </p>
        </div>

        {/* Article List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无文章</div>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => router.push(`/blog/${post.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{getIcon(post.title)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                          {getTag(post.title)}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {post.summary}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full transition-all text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? '✨ 正在生成新文章...' : '✨ AI 生成新攻略'}
          </button>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            更多攻略持续更新中 ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
