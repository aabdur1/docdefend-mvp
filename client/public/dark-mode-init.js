try {
  var saved = localStorage.getItem('darkMode');
  if (saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
