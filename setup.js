document.addEventListener("DOMContentLoaded", function () {
  const backButton = document.getElementById("backButton");
  const nextButton = document.getElementById("nextButton");
  const micAccessButton = document.getElementById("micAccessButton");
  const setupCompleteMessage = document.getElementById("setupCompleteMessage");

  const customSelect = document.querySelector(".custom-select");
  const selectSelected = customSelect.querySelector(".select-selected");
  const selectItems = customSelect.querySelector(".select-items");
  const nativeName = selectSelected.querySelector(".native-name");

  let currentStep = 2;
  let stepCompleted = [true, false, false, false];

  const progressBar = document.getElementById('progressBar');
  createSteps();
  updateSteps();
  updateNavigationButtons();
  showStep(2);

  function createSteps() {
    for (let i = 0; i < 3; i++) {
      const stepElement = document.createElement('div');
      stepElement.classList.add('step');
      progressBar.appendChild(stepElement);
      if (i < 2) {
        const connector = document.createElement('div');
        connector.classList.add('step-connector');
        progressBar.appendChild(connector);
      }
    }
  }

  function updateSteps() {
    const stepElements = document.querySelectorAll('.step');
    const connectors = document.querySelectorAll('.step-connector');

    stepElements.forEach((step, index) => {
      if (index < currentStep - 2) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (index === currentStep - 2) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });

    connectors.forEach((connector, index) => {
      if (index < currentStep - 2) {
        connector.classList.add('completed');
        connector.classList.remove('active');
      } else if (index === currentStep - 2) {
        connector.classList.add('active');
        connector.classList.remove('completed');
      } else {
        connector.classList.remove('active', 'completed');
      }
    });
  }

  function showStep(stepNumber) {
    document.querySelectorAll('.step-content').forEach((step, index) => {
      step.style.display = index + 2 === stepNumber ? 'block' : 'none';
    });
    currentStep = stepNumber;
    updateSteps();
    updateNavigationButtons();
  }

  function updateNavigationButtons() {
    backButton.style.display = currentStep > 2 ? 'inline-block' : 'none';
    nextButton.textContent = currentStep === 4 ? 'Finish' : 'Next';
    nextButton.disabled = !stepCompleted[currentStep - 2];
    nextButton.style.display = 'inline-block';
  }

  backButton.addEventListener("click", () => {
    if (currentStep > 2) {
      currentStep--;
      showStep(currentStep);
    }
  });

  nextButton.addEventListener("click", () => {
    if (currentStep < 4 && stepCompleted[currentStep - 2]) {
      if (currentStep === 2) {
        saveLanguageSelection();
      } else {
        currentStep++;
        showStep(currentStep);
      }
    } else if (currentStep === 4) {
      stepCompleted[2] = true;
      nextButton.textContent = 'Setup Complete 🎉';
      document.getElementById('step4').style.display = 'none';
      setupCompleteMessage.style.display = 'block';
      document.querySelector('.progress-container').style.display = 'none';
      nextButton.style.display = 'none';
      backButton.style.display = 'none';
    }
  });

  micAccessButton.addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        micAccessButton.style.backgroundColor = "green";
        micAccessButton.textContent = "Permission Granted";
        stepCompleted[1] = true;
        updateNavigationButtons();
        chrome.runtime.sendMessage({ action: "microphoneAccessGranted" });
      })
      .catch(error => console.error("Microphone access denied:", error));
  });

  function saveLanguageSelection() {
    const selectedLanguage = customSelect.dataset.selectedCode;
    if (!selectedLanguage) return;

    chrome.runtime.sendMessage(
      { action: "updateLanguageSetting", selectedLanguage },
      function (response) {
        if (response.status === "success") {
          currentStep++;
          showStep(currentStep);
        } else {
          console.error("Error saving language:", response.message);
        }
      }
    );
  }

  fetch(chrome.runtime.getURL('config/languages.json'))
    .then(response => response.json())
    .then(data => populateLanguageOptions(data.languages))
    .catch(error => console.error('Error loading languages:', error));

  function populateLanguageOptions(languages) {
    languages.forEach(lang => {
      const option = document.createElement("div");
      option.innerHTML = `<div class="native-name">${lang.native}</div><div class="english-name">${lang.name}</div>`;
      option.dataset.code = lang.code;
      option.addEventListener("click", function (e) {
        e.stopPropagation();
        nativeName.textContent = lang.native;
        selectSelected.classList.remove("select-arrow-active");
        selectItems.classList.add("select-hide");
        customSelect.dataset.selectedCode = lang.code;
        stepCompleted[0] = true;
        updateNavigationButtons();
      });
      selectItems.appendChild(option);
    });
  }

  selectSelected.addEventListener("click", function (e) {
    e.stopPropagation();
    this.classList.toggle("select-arrow-active");
    selectItems.classList.toggle("select-hide");
  });

  document.addEventListener("click", () => {
    selectSelected.classList.remove("select-arrow-active");
    selectItems.classList.add("select-hide");
  });
});
