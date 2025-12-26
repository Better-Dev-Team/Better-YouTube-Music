import { BrowserWindow } from 'electron';
import { BasePlugin } from '../Plugin';
import type { PluginMetadata } from '../Plugin';

/**
 * In-App Menu Plugin
 * Custom title bar and menu logic
 */
export class InAppMenu extends BasePlugin {
  public metadata: PluginMetadata = {
    name: 'in-app-menu',
    description: 'Custom title bar and in-app menu',
    version: '1.0.0',
  };

  public async onWindowCreated(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;

    const config = this.getConfig();
    
    // Set window frame based on config
    if (config.hideTitleBar) {
      window.setMenuBarVisibility(false);
    }
  }

  private getRendererScript(): string {
    const config = JSON.stringify(this.getConfig());
    return `
    (function() {
      'use strict';
      
      const config = ${config};
      if (!config.enabled) return;
      
      // Wait for DOM
      function createMenu() {
        if (!document.body || !(document.body instanceof Node)) {
          setTimeout(createMenu, 100);
          return;
        }
        
        try {
          // Remove existing menu if present
          const existing = document.getElementById('custom-menu-bar');
          if (existing) existing.remove();
          
          // Create custom menu bar
          const menuBar = document.createElement('div');
          menuBar.id = 'custom-menu-bar';
          menuBar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; height: 30px; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; padding: 0 10px; -webkit-app-region: drag; font-family: system-ui; font-size: 12px; color: white;';
          
          // Menu items
          const menuItems = [
            { label: 'File', submenu: ['New', 'Open', 'Save'] },
            { label: 'Edit', submenu: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste'] },
            { label: 'View', submenu: ['Zoom In', 'Zoom Out', 'Reset Zoom'] },
            { label: 'Help', submenu: ['About'] }
          ];
          
          menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.label;
            menuItem.style.cssText = 'padding: 5px 10px; cursor: pointer; -webkit-app-region: no-drag;';
            menuItem.addEventListener('mouseenter', () => {
              // Show submenu (simplified)
            });
            menuBar.appendChild(menuItem);
          });
          
          // Window controls
          const controls = document.createElement('div');
          controls.style.cssText = 'margin-left: auto; display: flex; gap: 5px; -webkit-app-region: no-drag;';
          
          ['minimize', 'maximize', 'close'].forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action === 'minimize' ? '−' : action === 'maximize' ? '□' : '×';
            btn.style.cssText = 'width: 30px; height: 30px; border: none; background: transparent; color: white; cursor: pointer; font-size: 16px;';
            btn.addEventListener('click', () => {
          if (window.electronAPI) {
            window.electronAPI.windowAction(action);
          }
        });
        controls.appendChild(btn);
      });
      
      menuBar.appendChild(controls);
      document.body.appendChild(menuBar);
      
      // Adjust body padding
      document.body.style.paddingTop = '30px';
    })();
    `;
  }

  public async onRendererLoaded(window: BrowserWindow): Promise<void> {
    if (!this.isEnabled()) return;
    await this.injectRendererScript(window, this.getRendererScript());
  }

  public getConfig() {
    return {
      hideTitleBar: false,
      showMenuBar: true,
      ...super.getConfig(),
    };
  }
}

