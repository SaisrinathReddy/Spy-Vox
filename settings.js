document.getElementById("saveSettings").addEventListener("click", () => {
  const enableNotifications = document.getElementById("enableNotifications").checked;
  const defaultLanguage = document.getElementById("defaultLanguage").value;

  chrome.storage.local.set(
    { enableNotifications, defaultLanguage },
    () => {
      alert("Settings saved!");
    }
  );
});

// Load existing settings on page load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["enableNotifications", "defaultLanguage"], (data) => {
    if (data.enableNotifications !== undefined) {
      document.getElementById("enableNotifications").checked = data.enableNotifications;
    }
    if (data.defaultLanguage) {
      document.getElementById("defaultLanguage").value = data.defaultLanguage;
    }
  });
});
