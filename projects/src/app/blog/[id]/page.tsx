'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface BlogPostDetail {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.post) {
          setPost(data.post);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">文章未找到</p>
          <button
            onClick={() => router.push('/blog')}
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            返回攻略列表
          </button>
        </div>
      </div>
    );
  }

  const paragraphs = post.content.split('\n').filter((line) => line.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/blog')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            ← 返回攻略
          </button>
        </div>

        {/* Article Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 leading-snug">
            {post.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {post.summary}
          </p>
        </div>

        {/* Article Content */}
        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 md:p-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {paragraphs.map((paragraph, index) => {
              const trimmed = paragraph.trim();

              // 加粗标题行
              if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                return (
                  <h3
                    key={index}
                    className="text-lg font-semibold text-slate-800 dark:text-white mt-6 mb-2"
                  >
                    {trimmed.replace(/\*\*/g, '')}
                  </h3>
                );
              }

              // 包含加粗的段落
              if (trimmed.includes('**')) {
                const parts = trimmed.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={i} className="text-slate-900 dark:text-white font-semibold">
                            {part.replace(/\*\*/g, '')}
                          </strong>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </p>
                );
              }

              // 错误/正确示范
              if (trimmed.startsWith('❌') || trimmed.startsWith('✅')) {
                return (
                  <p
                    key={index}
                    className={`leading-relaxed mb-3 px-4 py-2 rounded-lg ${
                      trimmed.startsWith('✅')
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {trimmed}
                  </p>
                );
              }

              // 普通段落
              return (
                <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors text-sm font-medium"
          >
            去练习一下 💬
          </button>
        </div>
      </div>
    </div>
  );
}
