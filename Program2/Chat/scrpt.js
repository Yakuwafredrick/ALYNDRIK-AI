// 🌟 PWA Install Banner
// ============================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Prevent multiple banners
    if (document.getElementById("install-banner")) return;

    // Create and append banner
    const banner = document.createElement("div");
    banner.id = "install-banner";
    banner.innerHTML = `
      <div id="install-inner">
        <img src="/icons/icon-192.png" alt="Alyndrik Icon">
        <div id="install-text">
          <strong>YakuwaZ Chat</strong>
          <span>Install YakuwaZ Chat to your device for the Better Experience.</span>
        </div>
        <button id="install-btn">Install</button>
        <span id="install-close">&times;</span>
      </div>
    `;
    document.body.appendChild(banner);

    // Add CSS
    const style = document.createElement("style");
    style.innerHTML = `
      #install-banner {
        position: fixed;
        bottom: env(safe-area-inset-bottom, 16px);
        left: 0;
        right: 0;
        z-index: 99999;
        padding: 0 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        animation: slideUp 0.4s ease-out;
        box-sizing: border-box;
      }

      #install-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
        padding: 12px 14px;
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        width: 100%;
        max-width: 520px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      #install-inner img {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      #install-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      #install-text strong {
        font-size: 0.95rem;
        color: #222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #install-text span {
        font-size: 0.8rem;
        color: #555;
        line-height: 1.2;
      }

      /* === ORIGINAL INSTALL BUTTON STYLE PRESERVED === */
      #install-btn {
        flex-shrink: 0;
        height: 36px;
        padding: 0 16px;
        border-radius: 18px;
        border: none;
        background: #007bff;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }

      #install-btn:active {
        transform: scale(0.96);
      }

      #install-close {
        flex-shrink: 0;
        font-size: 20px;
        color: #888;
        cursor: pointer;
        padding-left: 4px;
      }

      @media (max-width: 360px) {
        #install-inner {
          flex-wrap: wrap;
          gap: 8px;
        }
        #install-btn {
          width: 100%;
          text-align: center;
        }
        #install-close {
          position: absolute;
          top: 8px;
          right: 14px;
        }
      }

      @keyframes slideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById("install-btn").addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("Install outcome:", outcome);
        deferredPrompt = null;
        banner.remove();
    });

    document.getElementById("install-close").addEventListener("click", () => {
        banner.remove();
    });
});
