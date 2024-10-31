class PLLAYWebView {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
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
    this.updateDimensions();

    this.container.appendChild(this.webview);
    return this;
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
  }
}

module.exports = PLLAYWebView;