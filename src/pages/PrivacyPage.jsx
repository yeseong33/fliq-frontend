import React from 'react';
import { PRIVACY_POLICY } from '../constants/terms';

const PrivacyPage = () => {

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {PRIVACY_POLICY.title}
          </h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          시행일: {PRIVACY_POLICY.lastUpdated}
        </p>

        {/* 목차 */}
        <nav className="mb-10 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl" aria-label="목차">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">목차</h2>
          <ul className="space-y-2">
            {PRIVACY_POLICY.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#privacy-section-${i}`}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 본문 섹션 */}
        <div className="space-y-8">
          {PRIVACY_POLICY.sections.map((section, i) => (
            <section key={i} id={`privacy-section-${i}`}>
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
          {PRIVACY_POLICY.notice}
        </p>
      </main>
    </div>
  );
};

export default PrivacyPage;
