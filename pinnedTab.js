let mediaRecorder;
let socket;
let inactivityTimeout;
let isCleanupInProgress = false;
let dataAvailableHandler;

function getLanguageSetting() {
  return new Promise((resolve) => {
    chrome.storage.local.get('selectedLanguage', (result) => {
      resolve(result.selectedLanguage || 'en-US');
    });
  });
}

async function setupWebSocket() {
  const language = await getLanguageSetting();
  return new WebSocket(`wss://deepgram-server.replit.app/?language=${language}`);
}

function resetInactivityTimeout() {
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
  }
  inactivityTimeout = setTimeout(cleanup, 5 * 60 * 1000);
}

function cleanup() {
  if (isCleanupInProgress) return;
  isCleanupInProgress = true;

  if (inactivityTimeout) clearTimeout(inactivityTimeout);

  if (mediaRecorder) {
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    if (dataAvailableHandler) {
      mediaRecorder.removeEventListener("dataavailable", dataAvailableHandler);
      dataAvailableHandler = null;
    }
    if (mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    mediaRecorder = null;
  }

  if (socket) {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    socket = null;
  }

  isCleanupInProgress = false;
}

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(async (stream) => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    socket = await setupWebSocket();

    socket.onopen = () => {
      dataAvailableHandler = (event) => {
        if (socket && socket.readyState === WebSocket.OPEN && event.data.size > 0) {
          socket.send(event.data);
        }
      };

      mediaRecorder.addEventListener("dataavailable", dataAvailableHandler);
      mediaRecorder.start(250);
      resetInactivityTimeout();
    };

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data);
      const transcript = received.channel.alternatives[0]?.transcript;
      if (transcript && received.is_final) {
        resetInactivityTimeout();
        chrome.runtime.sendMessage({ type: 'transcriptUpdate', transcript: transcript + ' ' });
      }
    };

    socket.onclose = cleanup;
    socket.onerror = cleanup;
  })
  .catch((error) => {
    console.error('Error accessing microphone:', error);
    cleanup();
  });

window.addEventListener('beforeunload', () => {
  cleanup();
  chrome.runtime.sendMessage({ action: 'webSocketClosed' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closePinnedTab") {
    cleanup();
    window.close();
  }
});
