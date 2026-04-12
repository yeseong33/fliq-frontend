import React from 'react';
import { TERMS_OF_SERVICE_EN } from '../constants/terms_en';

const TermsPageEn = () => {

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {TERMS_OF_SERVICE_EN.title}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Effective date: {TERMS_OF_SERVICE_EN.lastUpdated}
        </p>

        <nav className="mb-10 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl" aria-label="Table of contents">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Table of Contents</h2>
          <ul className="space-y-2">
            {TERMS_OF_SERVICE_EN.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
            {TERMS_OF_SERVICE_EN.additionalTerms.map((term, i) => (
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

        <div className="space-y-8">
          {TERMS_OF_SERVICE_EN.sections.map((section, i) => (
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

        {TERMS_OF_SERVICE_EN.additionalTerms.map((term, i) => (
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

        <p className="mt-10 text-sm text-gray-400 dark:text-gray-500 text-center">
          {TERMS_OF_SERVICE_EN.notice}
        </p>
      </main>
    </div>
  );
};

export default TermsPageEn;
