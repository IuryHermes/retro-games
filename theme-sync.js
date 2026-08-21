(() => {
  const apply = () => {
    const theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.neoTheme = theme;
    document.documentElement.style.colorScheme = theme;
  };
  apply();
  addEventListener('storage', (event) => {
    if (event.key === 'theme') apply();
  });
})();
