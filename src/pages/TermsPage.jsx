import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TERMS_OF_SERVICE } from '../constants/terms';

const TermsPage = () => {
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
            {TERMS_OF_SERVICE.title}
          </h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          시행일: {TERMS_OF_SERVICE.lastUpdated}
        </p>

        {/* 목차 */}
        <nav className="mb-10 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl" aria-label="목차">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">목차</h2>
          <ul className="space-y-2">
            {TERMS_OF_SERVICE.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
            {TERMS_OF_SERVICE.additionalTerms.map((term, i) => (
              <li key={`additional-${i}`}>
                <a
                  href={`#additional-${i}`}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {term.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 서비스 이용약관 본문 */}
        <div className="space-y-8">
          {TERMS_OF_SERVICE.sections.map((section, i) => (
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

        {/* 부속 약관 */}
        {TERMS_OF_SERVICE.additionalTerms.map((term, i) => (
          <div key={i} id={`additional-${i}`} className="mt-12">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                {term.title}
              </h2>
              <div className="space-y-6">
                {term.sections.map((section, j) => (
                  <section key={j}>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* 안내 문구 */}
        <p className="mt-10 text-sm text-gray-400 dark:text-gray-500 text-center">
          {TERMS_OF_SERVICE.notice}
        </p>
      </main>
    </div>
  );
};

export default TermsPage;
