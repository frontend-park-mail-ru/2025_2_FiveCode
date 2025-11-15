import ejs from "ejs";

export function techSupportWrapper(): HTMLElement {
  const template = `
        <div class="tech-support-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.5 2C6.81 2 3 5.81 3 10.5C3 15.19 6.81 19 11.5 19H12V22C16.86 19.66 20 15 20 10.5C20 5.81 16.19 2 11.5 2ZM12.5 16.5H10.5V14.5H12.5V16.5ZM12.5 13H10.5C10.5 9.75 13.5 10 13.5 8C13.5 6.9 12.6 6 11.5 6C10.4 6 9.5 6.9 9.5 8H7.5C7.5 5.79 9.29 4 11.5 4C13.71 4 15.5 5.79 15.5 8C15.5 10.5 12.5 10.75 12.5 13Z" fill="#e8d6d6ff"/>
            </svg>
        </div>
    `;
  const container = document.createElement("div");
  container.innerHTML = template;

  const techSupportButton = container.querySelector(".tech-support-wrapper");

  const toggleIframe = () => {
    const existingIframe = document.getElementById("tech-support-iframe");
    if (existingIframe) {
      existingIframe.remove();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.id = "tech-support-iframe";
    iframe.src = "/techsupport";
    iframe.width = "400";
    iframe.height = "600";
    iframe.style.position = "fixed";
    iframe.style.right = "24px";
    iframe.style.bottom = "88px";
    iframe.style.zIndex = "1001";
    iframe.style.borderRadius = "8px";

    document.body.appendChild(iframe);
  };

  techSupportButton?.addEventListener("click", toggleIframe);

  window.addEventListener("message", (event) => {
    if (event.data === "close-support-iframe") {
      const iframe = document.getElementById("tech-support-iframe");
      if (iframe) {
        iframe.remove();
      }
    }
  });

  return container.firstElementChild as HTMLElement;
}
