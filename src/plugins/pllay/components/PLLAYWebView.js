const EventEmitter = require('events');

class PLLAYWebView extends EventEmitter {
  constructor(container, options = {}) {
    super();
    this.container = container;
    this.options = {
      visible: true,
      width: '100%',
      height: '600px',
      className: '',
      ...options
    };
    this.webview = null;
  }

  render() {
    if (!this.container) {
      throw new Error('Container element is required');
    }

    this.webview = document.createElement('div');
    this.webview.className = `pllay-webview ${this.options.className}`.trim();
    this.updateVisibility();
    this.updateDimensions();

    this.container.appendChild(this.webview);
    this.emit('rendered');
    return this;
  }

  setVisible(visible) {
    this.options.visible = visible;
    this.updateVisibility();
  }

  updateVisibility() {
    if (this.webview) {
      this.webview.style.display = this.options.visible ? 'block' : 'none';
    }
  }

  setDimensions(width, height) {
    this.options.width = width;
    this.options.height = height;
    this.updateDimensions();
  }

  updateDimensions() {
    if (this.webview) {
      this.webview.style.width = this.options.width;
      this.webview.style.height = this.options.height;
    }
  }

  destroy() {
    if (this.webview && this.container) {
      this.container.removeChild(this.webview);
    }
    this.webview = null;
    this.removeAllListeners();
  }
}

module.exports = PLLAYWebView;