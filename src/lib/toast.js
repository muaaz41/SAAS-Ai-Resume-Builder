// Minimal toast utility without external deps
let toastRoot;

function ensureRoot() {
  if (toastRoot && document.body.contains(toastRoot)) return toastRoot;
  toastRoot = document.createElement("div");
  toastRoot.id = "app-toast-root";
  toastRoot.style.position = "fixed";
  toastRoot.style.left = "50%";
  toastRoot.style.bottom = "24px";
  toastRoot.style.transform = "translateX(-50%)";
  toastRoot.style.display = "flex";
  toastRoot.style.flexDirection = "column";
  toastRoot.style.gap = "8px";
  toastRoot.style.zIndex = "9999";
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function showToast(message, { type = "error", duration = 4000 } = {}) {
  const root = ensureRoot();
  const node = document.createElement("div");
  node.textContent = message;
  node.style.padding = "10px 14px";
  node.style.borderRadius = "8px";
  node.style.color = "white";
  node.style.fontSize = "14px";
  node.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
  node.style.maxWidth = "90vw";
  node.style.wordBreak = "break-word";
  node.style.border = "1px solid rgba(255,255,255,0.15)";
  node.style.opacity = "0";
  node.style.transition = "opacity 150ms ease, transform 150ms ease";
  node.style.transform = "translateY(8px)";

  const bg = type === "success" ? "#16a34a" : type === "warning" ? "#f59e0b" : "#dc2626";
  node.style.background = bg;

  root.appendChild(node);
  // enter
  requestAnimationFrame(() => {
    node.style.opacity = "1";
    node.style.transform = "translateY(0)";
  });

  const remove = () => {
    node.style.opacity = "0";
    node.style.transform = "translateY(8px)";
    setTimeout(() => {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 180);
  };

  const timer = setTimeout(remove, duration);
  node.addEventListener("click", () => {
    clearTimeout(timer);
    remove();
  });

  return remove;
}


