import React from 'react';
import clsx from 'clsx';

const Input = ({
  label,
  error,
  shake = false,
  className = '',
  ...props
}) => {
  const inputClasses = clsx(
    'block w-full px-4 py-3 border-2 rounded-2xl transition-all duration-300 focus:outline-none',
    'bg-gray-50 dark:bg-gray-700/50',
    'border-gray-200 dark:border-gray-600',
    'text-gray-900 dark:text-white',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:bg-white dark:focus:bg-gray-700',
    'focus:border-blue-500 dark:focus:border-blue-400',
    'focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10',
    {
      'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/10 dark:focus:ring-red-400/10': error,
      'animate-shake': shake
    },
    className
  );

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && (
        <div role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
