// 페이지 로드 전 테마 적용 (깜빡임 방지)
(function() {
  var theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  var meta = document.querySelector('meta[name="theme-color"][media*="' + (theme === 'dark' ? 'dark' : 'light') + '"]');
  if (!meta) meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
})();
