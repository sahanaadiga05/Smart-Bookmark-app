document.addEventListener('DOMContentLoaded', () => {
  const urlPreview = document.getElementById('urlPreview');
  const saveBtn = document.getElementById('saveBtn');

  // Query the active tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab) {
      urlPreview.textContent = currentTab.title || currentTab.url;
      
      saveBtn.addEventListener('click', () => {
        // Open the deployed app in a new tab with the URL as a query parameter
        const appBaseUrl = 'https://smart-bookmark-app.vercel.app';
        const appUrl = `${appBaseUrl}/dashboard?addUrl=${encodeURIComponent(currentTab.url)}`;
        chrome.tabs.create({ url: appUrl });
      });
    } else {
      urlPreview.textContent = 'Cannot access tab';
      saveBtn.disabled = true;
    }
  });
});
