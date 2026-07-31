import React from 'react';
import SystemStatusScreen from './SystemStatusScreen';

export default function InternalServerErrorScreen(props) {
  const route = {
    ...props.route,
    params: {
      ...(props.route?.params || {}),
      variant: 'serverError',
      title: props.route?.params?.title || '500 Internal Server Issue',
    },
  };

  return <SystemStatusScreen {...props} route={route} />;
}
