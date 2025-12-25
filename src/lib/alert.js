// Custom alert and confirm dialogs
let alertRoot;
let confirmRoot;

function ensureAlertRoot() {
  if (alertRoot && document.body.contains(alertRoot)) return alertRoot;
  alertRoot = document.createElement("div");
  alertRoot.id = "app-alert-root";
  alertRoot.style.position = "fixed";
  alertRoot.style.top = "0";
  alertRoot.style.left = "0";
  alertRoot.style.right = "0";
  alertRoot.style.bottom = "0";
  alertRoot.style.display = "flex";
  alertRoot.style.alignItems = "center";
  alertRoot.style.justifyContent = "center";
  alertRoot.style.zIndex = "10000";
  alertRoot.style.background = "rgba(0, 0, 0, 0.6)";
  alertRoot.style.backdropFilter = "blur(4px)";
  document.body.appendChild(alertRoot);
  return alertRoot;
}

function ensureConfirmRoot() {
  if (confirmRoot && document.body.contains(confirmRoot)) return confirmRoot;
  confirmRoot = document.createElement("div");
  confirmRoot.id = "app-confirm-root";
  confirmRoot.style.position = "fixed";
  confirmRoot.style.top = "0";
  confirmRoot.style.left = "0";
  confirmRoot.style.right = "0";
  confirmRoot.style.bottom = "0";
  confirmRoot.style.display = "flex";
  confirmRoot.style.alignItems = "center";
  confirmRoot.style.justifyContent = "center";
  confirmRoot.style.zIndex = "10000";
  confirmRoot.style.background = "rgba(0, 0, 0, 0.6)";
  confirmRoot.style.backdropFilter = "blur(4px)";
  document.body.appendChild(confirmRoot);
  return confirmRoot;
}

export function showAlert(message) {
  return new Promise((resolve) => {
    const root = ensureAlertRoot();
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.background = "transparent";
    
    const modal = document.createElement("div");
    modal.style.background = "#ffffff";
    modal.style.borderRadius = "12px";
    modal.style.padding = "24px";
    modal.style.maxWidth = "400px";
    modal.style.width = "90%";
    modal.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.3)";
    modal.style.position = "relative";
    modal.style.zIndex = "10001";
    modal.style.animation = "slideUp 0.2s ease-out";

    const messageEl = document.createElement("div");
    messageEl.textContent = message;
    messageEl.style.fontSize = "15px";
    messageEl.style.color = "#0f172a";
    messageEl.style.lineHeight = "1.6";
    messageEl.style.marginBottom = "20px";
    messageEl.style.whiteSpace = "pre-wrap";
    messageEl.style.wordBreak = "break-word";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";

    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    okButton.style.padding = "10px 20px";
    okButton.style.borderRadius = "8px";
    okButton.style.border = "none";
    okButton.style.background = "#2563eb";
    okButton.style.color = "#ffffff";
    okButton.style.fontSize = "14px";
    okButton.style.fontWeight = "600";
    okButton.style.cursor = "pointer";
    okButton.style.transition = "all 0.2s ease";
    okButton.onmouseenter = () => {
      okButton.style.background = "#1d4ed8";
      okButton.style.transform = "translateY(-1px)";
    };
    okButton.onmouseleave = () => {
      okButton.style.background = "#2563eb";
      okButton.style.transform = "translateY(0)";
    };
    okButton.onclick = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      overlay.remove();
      modal.remove();
      if (root.children.length === 0) {
        root.style.display = "none";
      }
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve();
      }
    };

    buttonContainer.appendChild(okButton);
    modal.appendChild(messageEl);
    modal.appendChild(buttonContainer);
    root.appendChild(overlay);
    root.appendChild(modal);
    root.style.display = "flex";

    // Add animation styles if not already present
    if (!document.getElementById("alert-animations")) {
      const style = document.createElement("style");
      style.id = "alert-animations";
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Focus the button for keyboard accessibility
    setTimeout(() => okButton.focus(), 100);
    
    // Handle Enter key
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        cleanup();
        resolve();
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
  });
}

export function showConfirm(message) {
  return new Promise((resolve) => {
    const root = ensureConfirmRoot();
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.background = "transparent";
    
    const modal = document.createElement("div");
    modal.style.background = "#ffffff";
    modal.style.borderRadius = "12px";
    modal.style.padding = "24px";
    modal.style.maxWidth = "400px";
    modal.style.width = "90%";
    modal.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.3)";
    modal.style.position = "relative";
    modal.style.zIndex = "10001";
    modal.style.animation = "slideUp 0.2s ease-out";

    const messageEl = document.createElement("div");
    messageEl.textContent = message;
    messageEl.style.fontSize = "15px";
    messageEl.style.color = "#0f172a";
    messageEl.style.lineHeight = "1.6";
    messageEl.style.marginBottom = "20px";
    messageEl.style.whiteSpace = "pre-wrap";
    messageEl.style.wordBreak = "break-word";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.borderRadius = "8px";
    cancelButton.style.border = "1px solid #d1d5db";
    cancelButton.style.background = "#ffffff";
    cancelButton.style.color = "#374151";
    cancelButton.style.fontSize = "14px";
    cancelButton.style.fontWeight = "600";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.transition = "all 0.2s ease";
    cancelButton.onmouseenter = () => {
      cancelButton.style.background = "#f9fafb";
      cancelButton.style.borderColor = "#9ca3af";
    };
    cancelButton.onmouseleave = () => {
      cancelButton.style.background = "#ffffff";
      cancelButton.style.borderColor = "#d1d5db";
    };
    cancelButton.onclick = () => {
      cleanup();
      resolve(false);
    };

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    confirmButton.style.padding = "10px 20px";
    confirmButton.style.borderRadius = "8px";
    confirmButton.style.border = "none";
    confirmButton.style.background = "#2563eb";
    confirmButton.style.color = "#ffffff";
    confirmButton.style.fontSize = "14px";
    confirmButton.style.fontWeight = "600";
    confirmButton.style.cursor = "pointer";
    confirmButton.style.transition = "all 0.2s ease";
    confirmButton.onmouseenter = () => {
      confirmButton.style.background = "#1d4ed8";
      confirmButton.style.transform = "translateY(-1px)";
    };
    confirmButton.onmouseleave = () => {
      confirmButton.style.background = "#2563eb";
      confirmButton.style.transform = "translateY(0)";
    };
    confirmButton.onclick = () => {
      cleanup();
      resolve(true);
    };

    const cleanup = () => {
      overlay.remove();
      modal.remove();
      if (root.children.length === 0) {
        root.style.display = "none";
      }
      document.removeEventListener("keydown", handleKeyDown);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(messageEl);
    modal.appendChild(buttonContainer);
    root.appendChild(overlay);
    root.appendChild(modal);
    root.style.display = "flex";

    // Add animation styles if not already present
    if (!document.getElementById("alert-animations")) {
      const style = document.createElement("style");
      style.id = "alert-animations";
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Focus the confirm button for keyboard accessibility
    setTimeout(() => confirmButton.focus(), 100);
    
    // Handle keyboard
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
        resolve(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        cleanup();
        resolve(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
  });
}

