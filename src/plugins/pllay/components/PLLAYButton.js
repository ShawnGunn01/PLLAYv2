const EventEmitter = require('events');

class PLLAYButton extends EventEmitter {
  constructor(container, options = {}) {
    super();
    this.container = container;
    this.options = {
      visible: true,
      text: 'PLLAY',
      className: '',
      ...options
    };
    this.button = null;
  }

  render() {
    if (!this.container) {
      throw new Error('Container element is required');
    }

    this.button = document.createElement('button');
    this.button.className = `pllay-button ${this.options.className}`.trim();
    this.button.textContent = this.options.text;
    this.updateVisibility();

    // Add event listeners
    this.button.addEventListener('click', (e) => this.emit('click', e));
    this.button.addEventListener('mouseover', () => {
      this.button.style.backgroundColor = '#0056b3';
    });
    this.button.addEventListener('mouseout', () => {
      this.button.style.backgroundColor = '#007bff';
    });

    this.container.appendChild(this.button);
    return this;
  }

  setVisible(visible) {
    this.options.visible = visible;
    this.updateVisibility();
  }

  updateVisibility() {
    if (this.button) {
      this.button.style.display = this.options.visible ? 'block' : 'none';
    }
  }

  setText(text) {
    this.options.text = text;
    if (this.button) {
      this.button.textContent = text;
    }
  }

  destroy() {
    if (this.button && this.container) {
      this.button.removeEventListener('click', this.handleClick);
      this.container.removeChild(this.button);
    }
    this.button = null;
    this.removeAllListeners();
  }
}

module.exports = PLLAYButton;