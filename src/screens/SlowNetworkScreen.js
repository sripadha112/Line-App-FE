import React from 'react';
import SystemStatusScreen from './SystemStatusScreen';

export default function SlowNetworkScreen(props) {
  const route = {
    ...props.route,
    params: {
      ...(props.route?.params || {}),
      variant: 'slowNetwork',
    },
  };

  return <SystemStatusScreen {...props} route={route} />;
}
