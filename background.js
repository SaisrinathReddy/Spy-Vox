let isActive = false;
let pinnedTabId = null;

function checkLoginStatus(callback) {
  callback(true, "guest@example.com");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkLoginStatus") {
    checkLoginStatus((isLoggedIn, email) => {
      sendResponse({ isLoggedIn, email });
    });
    return true;
  }
  if (message.action === "updateLanguageSetting") {
    const { selectedLanguage } = message;
    chrome.storage.local.set({ selectedLanguage }, () => {
      sendResponse({ status: "success" });
    });
    return true;
  }
  if (message.action === "microphoneAccessGranted") {
    sendResponse({ status: "success" });
    return true;
  }
  if (message.type === "transcriptUpdate") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "insertTranscript", transcript: message.transcript },
          (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            } else {
              sendResponse({ status: "success", response });
            }
          }
        );
      } else {
        sendResponse({ status: "error", message: "No active tab found" });
      }
    });
    return true;
  }
  if (message.action === "closeTab") {
    chrome.tabs.remove(sender.tab.id, () => {
      sendResponse({ status: "success" });
    });
    return true;
  }
  if (message.action === "closePinnedTab") {
    chrome.storage.local.get("pinnedTabId", (result) => {
      const pinnedTabId = result.pinnedTabId;
      if (pinnedTabId) {
        chrome.tabs.remove(pinnedTabId, () => {
          chrome.storage.local.remove("pinnedTabId", () => {
            sendResponse({ status: "Pinned tab closed" });
            setExtensionIconInactive();
          });
        });
      } else {
        sendResponse({ status: "error", message: "No pinned tab ID found" });
      }
    });
    return true;
  }
  if (message.action === "webSocketClosed") {
    setExtensionIconInactive();
    return true;
  }
});

chrome.action.onClicked.addListener(() => {
  isActive = !isActive;
  const iconPath = isActive
    ? {
        "16": "activeIcon.png",
        "32": "activeIcon.png",
        "48": "activeIcon.png",
        "128": "activeIcon.png"
      }
    : {
        "16": "virus_10420078.png",
        "32": "virus_10420078.png",
        "48": "virus_10420078.png",
        "128": "virus_10420078.png"
      };
  chrome.action.set
