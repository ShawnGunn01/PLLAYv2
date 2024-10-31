import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import PropTypes from 'prop-types';

const PLLAYWebView = React.forwardRef(({
  visible = true,
  style,
  onMessage,
  ...props
}, ref) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={ref}
        style={styles.webview}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        {...props}
      />
    </View>
  );
});

PLLAYWebView.propTypes = {
  visible: PropTypes.bool,
  style: PropTypes.object,
  onMessage: PropTypes.func
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 5
      }
    })
  },
  webview: {
    flex: 1
  }
});

export default PLLAYWebView;