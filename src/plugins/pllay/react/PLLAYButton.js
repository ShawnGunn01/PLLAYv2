const React = require('react');

const PLLAYButton = React.forwardRef(({
  visible = true,
  onClick,
  className = '',
  style = {},
  children,
  ...props
}, ref) => {
  const buttonStyle = {
    display: visible ? 'block' : 'none',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
    ...style
  };

  return (
    <button
      ref={ref}
      className={`pllay-button ${className}`}
      style={buttonStyle}
      onClick={onClick}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#0056b3';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#007bff';
      }}
      {...props}
    >
      {children}
    </button>
  );
});

PLLAYButton.displayName = 'PLLAYButton';

module.exports = PLLAYButton;