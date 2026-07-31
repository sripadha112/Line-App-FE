import React from 'react';
import SystemStatusScreen from './SystemStatusScreen';

export default function NotFoundScreen(props) {
  const route = {
    ...props.route,
    params: {
      ...(props.route?.params || {}),
      variant: 'notFound',
      title: props.route?.params?.title || '404 Not Found',
    },
  };

  return <SystemStatusScreen {...props} route={route} />;
}
