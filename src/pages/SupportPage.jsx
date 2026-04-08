import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SUPPORT_INFO } from '../constants/terms';

const SupportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {SUPPORT_INFO.title}
          </h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          최종 업데이트: {SUPPORT_INFO.lastUpdated}
        </p>

        {/* 목차 */}
        <nav className="mb-10 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl" aria-label="목차">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">목차</h2>
          <ul className="space-y-2">
            {SUPPORT_INFO.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 본문 */}
        <div className="space-y-8">
          {SUPPORT_INFO.sections.map((section, i) => (
            <section key={i} id={`section-${i}`}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* 안내 문구 */}
        <p className="mt-10 text-sm text-gray-400 dark:text-gray-500 text-center">
          {SUPPORT_INFO.notice}
        </p>
      </main>
    </div>
  );
};

export default SupportPage;
