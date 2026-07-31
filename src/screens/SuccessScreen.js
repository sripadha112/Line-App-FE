import React from 'react';
import SystemStatusScreen from './SystemStatusScreen';

export default function SuccessScreen(props) {
  const route = {
    ...props.route,
    params: {
      ...(props.route?.params || {}),
      variant: 'success',
    },
  };

  return <SystemStatusScreen {...props} route={route} />;
}
