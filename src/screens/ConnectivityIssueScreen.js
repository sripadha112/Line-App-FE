import React from 'react';
import SystemStatusScreen from './SystemStatusScreen';

export default function ConnectivityIssueScreen(props) {
  const route = {
    ...props.route,
    params: {
      ...(props.route?.params || {}),
      variant: 'connectivity',
    },
  };

  return <SystemStatusScreen {...props} route={route} />;
}
