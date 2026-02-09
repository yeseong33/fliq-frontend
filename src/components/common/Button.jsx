import React from 'react';
import clsx from 'clsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'btn-press inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'btn-press-primary text-white rounded-2xl focus:ring-blue-500',
    secondary: 'btn-press-secondary text-gray-900 dark:text-gray-100 rounded-2xl focus:ring-gray-500',
    danger: 'btn-press-danger text-white rounded-2xl focus:ring-red-500',
    success: 'btn-press-success text-white rounded-2xl focus:ring-green-500',
    ghost: 'btn-press-ghost text-gray-700 dark:text-gray-300 rounded-2xl focus:ring-gray-500',
    outline: 'btn-press-outline border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm font-bold',
    lg: 'px-6 py-4 text-lg font-bold',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    { 'w-full': fullWidth },
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      <span className="btn-content">
        {loading ? (
          <span className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        ) : (
          children
        )}
      </span>
    </button>
  );
};

export default Button;
