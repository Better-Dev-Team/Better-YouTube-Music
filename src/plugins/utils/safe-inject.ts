import { BrowserWindow } from 'electron';

/**
 * Safely inject JavaScript into a page, bypassing Trusted Types
 * Uses a script tag injection method that works with YouTube's CSP
 */
export async function safeInjectScript(window: BrowserWindow, script: string): Promise<void> {
  // Wrap script in a way that bypasses Trusted Types
  const wrappedScript = `
    (function() {
      try {
        // Create a script element and inject it
        const scriptEl = document.createElement('script');
        scriptEl.textContent = ${JSON.stringify(script)};
        
        // Use a safe injection point
        if (document.head) {
          document.head.appendChild(scriptEl);
        } else if (document.documentElement) {
          document.documentElement.appendChild(scriptEl);
        } else {
          // Fallback: use Function constructor (bypasses Trusted Types)
          new Function(script)();
        }
      } catch (error) {
        console.error('Plugin injection error:', error);
      }
    })();
  `;

  await window.webContents.executeJavaScript(wrappedScript, true);
}

/**
 * Safely inject CSS into a page
 */
export async function safeInjectCSS(window: BrowserWindow, css: string, id: string): Promise<void> {
  const script = `
    (function() {
      try {
        // Remove existing style if present
        const existing = document.getElementById(${JSON.stringify(id)});
        if (existing) existing.remove();
        
        // Create style element
        const style = document.createElement('style');
        style.id = ${JSON.stringify(id)};
        style.textContent = ${JSON.stringify(css)};
        
        // Inject safely
        if (document.head) {
          document.head.appendChild(style);
        } else if (document.documentElement) {
          document.documentElement.appendChild(style);
        }
      } catch (error) {
        console.error('CSS injection error:', error);
      }
    })();
  `;

  await window.webContents.executeJavaScript(script, true);
}

/**
 * Wait for DOM to be ready
 */
export function waitForDOM(callback: () => void, maxWait = 5000): void {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(callback, 100);
    return;
  }

  const startTime = Date.now();
  const checkInterval = setInterval(() => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      clearInterval(checkInterval);
      setTimeout(callback, 100);
    } else if (Date.now() - startTime > maxWait) {
      clearInterval(checkInterval);
      callback(); // Call anyway after timeout
    }
  }, 100);
}

/**
 * Safe MutationObserver that checks for valid Node
 */
export function safeObserve(target: Node | null, callback: MutationCallback, options?: MutationObserverInit): MutationObserver | null {
  if (!target || !(target instanceof Node)) {
    return null;
  }

  try {
    const observer = new MutationObserver(callback);
    observer.observe(target, options || { childList: true, subtree: true });
    return observer;
  } catch (error) {
    console.error('MutationObserver error:', error);
    return null;
  }
}

