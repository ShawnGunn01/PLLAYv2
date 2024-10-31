import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const PLLAYButton = React.forwardRef(({
  visible = true,
  onPress,
  style,
  children,
  ...props
}, ref) => {
  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity
      ref={ref}
      style={[styles.button, style]}
      onPress={onPress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
});

PLLAYButton.propTypes = {
  visible: PropTypes.bool,
  onPress: PropTypes.func,
  style: PropTypes.object,
  children: PropTypes.node
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  }
});

export default PLLAYButton;