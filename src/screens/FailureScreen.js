import React from 'react';
import SystemStatusScreen from './SystemStatusScreen';

export default function FailureScreen(props) {
  const route = {
    ...props.route,
    params: {
      ...(props.route?.params || {}),
      variant: 'failure',
    },
  };

  return <SystemStatusScreen {...props} route={route} />;
}
