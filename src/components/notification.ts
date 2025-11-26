export type NotificationType = "success" | "error" | "info";

export function showNotification(
  message: string,
  type: NotificationType = "info"
) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `notification-toast ${type}`;

  const textSpan = document.createElement("span");
  textSpan.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "notification-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => removeToast(toast);

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("notification-toast--visible");
  });

  setTimeout(() => {
    removeToast(toast);
  }, 5000);
}

function removeToast(toast: HTMLElement) {
  toast.classList.remove("notification-toast--visible");
  toast.addEventListener("transitionend", () => {
    toast.remove();
    const container = document.getElementById("notification-container");
    if (container && container.children.length === 0) {
      container.remove();
    }
  });
}
