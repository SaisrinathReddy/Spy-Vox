let popupVisible = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "togglePopup") {
    popupVisible = !popupVisible;
    if (popupVisible) {
      showPopup();
    } else {
      removePopup();
    }
  }
  if (message.action === "insertTranscript") {
    insertTranscript(message.transcript);
  }
});

function showPopup() {
  const popup = document.createElement("div");
  popup.id = "spyvox-popup";
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.right = "20px";
  popup.style.background = "rgba(0,0,0,0.85)";
  popup.style.color = "white";
  popup.style.padding = "10px 20px";
  popup.style.borderRadius = "8px";
  popup.style.zIndex = "9999";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.textContent = "Spy-Vox is ready. Start speaking...";
  document.body.appendChild(popup);
}

function removePopup() {
  const popup = document.getElementById("spyvox-popup");
  if (popup) {
    popup.remove();
  }
}

function insertTranscript(transcript) {
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === "TEXTAREA" || (activeElement.tagName === "INPUT" && activeElement.type === "text"))) {
    activeElement.value += transcript;
  } else if (document.execCommand) {
    document.execCommand("insertText", false, transcript);
  }
}
