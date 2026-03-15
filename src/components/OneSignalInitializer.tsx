'use client';

import { useEffect } from 'react';

export default function OneSignalInitializer() {
  useEffect(() => {
    // OneSignal initialization
    const initOneSignal = () => {
      // @ts-expect-error - OneSignal is injected by the script
      window.OneSignal = window.OneSignal || [];
      // @ts-expect-error - OneSignal is injected by the script
      window.OneSignal.push(function() {
        // @ts-expect-error - OneSignal is injected by the script
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          safari_web_id: "web.onesignal.auto.104430e3-4610-4f51-8e01-f9260d8a571f",
          notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'default',
            position: 'bottom-right',
            offset: {
              bottom: '20px',
              right: '20px'
            },
            colors: {
              'circle.background': '#685de6',
              'circle.foreground': 'white',
              'badge.background': '#685de6',
              'badge.foreground': 'white',
              'badge.bordercolor': 'white',
              'pulse.color': 'white',
              'dialog.button.background.hover': '#685de6',
              'dialog.button.background.active': '#685de6',
              'dialog.button.background': '#685de6',
              'dialog.button.foreground': 'white'
            },
            text: {
              'tip.state.unsubscribed': 'Subscribe for new articles',
              'tip.state.subscribed': "You are subscribed!",
              'tip.state.blocked': "You blocked notifications",
              'message.prenotify': "Click to subscribe for new articles",
              'message.action.subscribed': "Thanks for subscribing!",
              'message.action.resubscribed': "You're subscribed!",
              'message.action.unsubscribed': "You won't receive notifications anymore",
              'dialog.main.title': 'Sathyadhare Updates',
              'dialog.main.button.subscribe': 'SUBSCRIBE',
              'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
              'dialog.blocked.title': 'Unblock Notifications',
              'dialog.blocked.message': "Follow these instructions to allow notifications:"
            }
          },
          allowLocalhostAsSecureOrigin: true,
        });
      });
    };

    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      script.onload = initOneSignal;
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
