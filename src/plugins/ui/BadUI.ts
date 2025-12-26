import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';
import { BrowserWindow } from 'electron';

/**
 * BadUI Plugin
 * Makes YouTube look absolutely terrible with Comic Sans, neon colors, and excessive animations
 * Yabosen approved design!
 */
export class BadUI extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'bad-ui',
    description: 'Makes YouTube look absolutely terrible (Yabosen approved!)',
    version: '1.0.0',
  };

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
      (function() {
        const config = ${config};
        if (!config.enabled) return;
        
        function injectBadUICSS() {
          const styleId = 'bad-ui-styles';
          let style = document.getElementById(styleId);
          
          if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
          }
          
          const css = \`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            
            @keyframes rainbow {
              0% { color: #ff0000; }
              16% { color: #ff7f00; }
              33% { color: #ffff00; }
              50% { color: #00ff00; }
              66% { color: #0000ff; }
              83% { color: #4b0082; }
              100% { color: #9400d3; }
            }
            
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px); }
              75% { transform: translateX(10px); }
            }
            
            @keyframes rainbow-bg {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            /* Apply Comic Sans to everything */
            * {
              font-family: 'Comic Sans MS', 'Comic Sans', 'Papyrus', 'Impact', cursive, sans-serif !important;
            }
            
            /* Terrible header styling */
            #header, ytd-masthead, #masthead-container {
              background: linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff) !important;
              background-size: 200% 200% !important;
              animation: rainbow-bg 2s linear infinite !important;
              border: 10px solid #ff0000 !important;
              box-shadow: 0 10px 50px #00ff00, inset 0 0 30px #ffff00 !important;
              transform: rotate(-1deg) !important;
            }
            
            /* Search bar */
            #search, ytd-searchbox, input#search {
              background: linear-gradient(135deg, #ffff00, #ff00ff) !important;
              border: 8px solid #ff0000 !important;
              border-radius: 0 !important;
              color: #000000 !important;
              font-weight: bold !important;
              text-shadow: 3px 3px 0px #ffffff !important;
              box-shadow: inset 0 0 20px #ffffff, 5px 5px 0px #000000 !important;
              transform: skew(-2deg) !important;
              animation: rainbow-bg 3s linear infinite !important;
            }
            
            /* Buttons */
            button, ytd-button-renderer, #button, .yt-spec-button-shape-next {
              background: linear-gradient(135deg, #00ffff, #ff00ff) !important;
              border: 5px solid #ff0000 !important;
              border-radius: 0 !important;
              color: #000000 !important;
              font-weight: bold !important;
              text-shadow: 3px 3px 0px #ffffff !important;
              box-shadow: 5px 5px 0px #000000, 0 0 20px #ff00ff !important;
              transform: skew(-5deg) rotate(2deg) !important;
            }
            
            button:hover, ytd-button-renderer:hover {
              animation: shake 0.3s infinite, bounce 0.5s infinite !important;
              transform: skew(-5deg) rotate(-2deg) scale(1.2) !important;
              background: linear-gradient(135deg, #ff0000, #ffff00) !important;
            }
            
            /* Video thumbnails */
            ytd-thumbnail, #thumbnail, .ytd-thumbnail {
              border: 8px solid #00ffff !important;
              box-shadow: 15px 15px 0px #000000, 0 0 50px #ff00ff !important;
              transform: rotate(2deg) !important;
            }
            
            ytd-thumbnail:hover, #thumbnail:hover {
              animation: bounce 0.5s infinite !important;
              transform: rotate(-2deg) scale(1.1) !important;
              border-color: #ff00ff !important;
              box-shadow: 20px 20px 0px #000000, 0 0 100px #ffff00 !important;
            }
            
            /* Video titles */
            #video-title, .ytd-video-meta-block, h3, .yt-simple-endpoint {
              color: #ff0000 !important;
              text-shadow: 5px 5px 0px #00ffff, -5px -5px 0px #ffff00, 0 0 30px #ff00ff !important;
              animation: rainbow 3s infinite !important;
              font-weight: bold !important;
              text-decoration: underline wavy #ff00ff !important;
              letter-spacing: 2px !important;
            }
            
            /* Sidebar */
            #guide, ytd-guide-renderer, #sections {
              background: repeating-linear-gradient(
                45deg,
                #ff00ff,
                #ff00ff 20px,
                #00ffff 20px,
                #00ffff 40px,
                #ffff00 40px,
                #ffff00 60px
              ) !important;
              border: 10px double #ff0000 !important;
              box-shadow: inset 0 0 50px #ffffff, 0 0 100px #ff00ff !important;
            }
            
            /* Main content area */
            #content, #primary, ytd-watch-flexy {
              background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff) !important;
              background-size: 400% 400% !important;
              animation: rainbow-bg 5s linear infinite !important;
              border: 5px dotted #ff0000 !important;
            }
            
            /* Video player */
            #movie_player, .html5-video-player, video {
              border: 15px solid #00ffff !important;
              box-shadow: 0 0 100px #ff00ff, inset 0 0 50px #ffff00 !important;
              transform: rotate(0.5deg) !important;
            }
            
            /* Comments */
            #comments, ytd-comments {
              background: rgba(255, 255, 0, 0.5) !important;
              border: 8px dashed #ff00ff !important;
              padding: 20px !important;
            }
            
            /* Add spinning stars to everything */
            ytd-rich-item-renderer::before,
            ytd-video-renderer::before {
              content: "⭐" !important;
              position: absolute !important;
              top: -20px !important;
              right: -20px !important;
              font-size: 60px !important;
              animation: spin 2s linear infinite !important;
              z-index: 1000 !important;
            }
            
            /* Marquee text effect on page title */
            title {
              animation: blink 0.5s infinite !important;
            }
            
            /* Make everything bounce on hover */
            *:hover {
              animation: bounce 0.3s infinite !important;
            }
            
            /* Terrible scrollbar */
            ::-webkit-scrollbar {
              width: 30px !important;
              background: linear-gradient(90deg, #ff00ff, #00ffff) !important;
            }
            
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #ffff00, #ff0000) !important;
              border: 5px solid #000000 !important;
              box-shadow: 0 0 20px #ff00ff !important;
            }
            
            /* Add blinking to important elements */
            #logo, ytd-logo {
              animation: blink 1s infinite, spin 3s linear infinite !important;
            }
            
            /* Notification bell */
            #notification-button, ytd-notification-topbar-button-renderer {
              animation: bounce 0.5s infinite, rainbow 2s infinite !important;
            }
            
            /* Channel icons */
            #avatar, ytd-channel-avatar-renderer img {
              border: 10px solid #ff00ff !important;
              box-shadow: 0 0 50px #00ffff, 5px 5px 0px #000000 !important;
              transform: rotate(5deg) !important;
              animation: spin 5s linear infinite !important;
            }
          \`;
          
          style.textContent = css;
        }
        
        function addMarqueeBanners() {
          // Remove existing banners
          const existing = document.getElementById('bad-ui-top-banner') || document.getElementById('bad-ui-bottom-banner');
          if (existing) return;
          
          // Top banner
          const topBanner = document.createElement('div');
          topBanner.id = 'bad-ui-top-banner';
          topBanner.style.cssText = \`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
            background-size: 200% 200%;
            animation: rainbow-bg 2s linear infinite;
            border: 5px dashed #ff0000;
            z-index: 10000;
            display: flex;
            align-items: center;
            font-family: 'Comic Sans MS', cursive;
            font-size: 28px;
            font-weight: bold;
            color: #000000;
            text-shadow: 3px 3px 0px #ffffff;
            overflow: hidden;
          \`;
          
          const topMarquee = document.createElement('marquee');
          topMarquee.textContent = '⚡⚡⚡ YABOSEN APPROVED UI DESIGN ⚡⚡⚡ BEST UI IN THE WORLD ⚡⚡⚡ BUY MUV-LUV ⚡⚡⚡';
          topMarquee.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center;';
          topBanner.appendChild(topMarquee);
          
          // Bottom banner
          const bottomBanner = document.createElement('div');
          bottomBanner.id = 'bad-ui-bottom-banner';
          bottomBanner.style.cssText = \`
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: linear-gradient(90deg, #ffff00, #ff00ff, #00ffff, #ffff00);
            background-size: 200% 200%;
            animation: rainbow-bg 2s linear infinite;
            border: 5px double #00ff00;
            z-index: 10000;
            display: flex;
            align-items: center;
            font-family: 'Comic Sans MS', cursive;
            font-size: 24px;
            font-weight: bold;
            color: #000000;
            text-shadow: 2px 2px 0px #ffffff;
            overflow: hidden;
          \`;
          
          const bottomMarquee = document.createElement('marquee');
          bottomMarquee.textContent = '🎮 MUV-LUV IS THE BEST GAME EVER 🎮 YABOSEN LOVES THIS UI 🎮';
          bottomMarquee.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; direction: rtl;';
          bottomBanner.appendChild(bottomMarquee);
          
          document.body.appendChild(topBanner);
          document.body.appendChild(bottomBanner);
          
          // Adjust page content to account for banners
          const content = document.getElementById('content') || document.body;
          if (content) {
            content.style.paddingTop = '70px';
            content.style.paddingBottom = '70px';
          }
        }
        
        function init() {
          injectBadUICSS();
          setTimeout(addMarqueeBanners, 500);
        }
        
        // Run on page load
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
        
        // Re-inject on navigation
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(init, 500);
          }
        });
        
        observer.observe(document, { subtree: true, childList: true });
        
        // Also re-inject when DOM changes
        const domObserver = new MutationObserver(() => {
          setTimeout(init, 100);
        });
        
        domObserver.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true
        });
      })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await window.webContents.executeJavaScript(this.getRendererScript(), true);
      console.log('BadUI: Injected successfully - Yabosen will be pleased!');
    } catch (error) {
      console.error('BadUI: Error injecting script', error);
    }
  }

  public getConfig(): any {
    return {
      ...super.getConfig(),
      enabled: true, // Default to enabled for maximum terrible-ness
    };
  }
}

