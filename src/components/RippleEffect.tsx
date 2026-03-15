'use client';

import { useEffect } from 'react';

export function RippleEffect() {
  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      // Find closest clickable element
      const target = (e.target as HTMLElement).closest('button, a, .tap-highlight, .ripple, [role="button"]') as HTMLElement;
      
      if (!target) return;
      
      // Ignore if explicitly disabled or already has a ripple running (maybe?)
      if (target.hasAttribute('disabled')) return;
      
      const rect = target.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;
      
      let clientX, clientY;
      if (e.type === 'touchstart') {
          const touchEvent = e as TouchEvent;
          clientX = touchEvent.touches[0].clientX;
          clientY = touchEvent.touches[0].clientY;
      } else {
          const mouseEvent = e as MouseEvent;
          clientX = mouseEvent.clientX;
          clientY = mouseEvent.clientY;
      }

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${clientX - rect.left - radius}px`;
      circle.style.top = `${clientY - rect.top - radius}px`;
      circle.classList.add('global-ripple');
      
      // We need to ensure target has position relative and overflow hidden
      const style = window.getComputedStyle(target);
      if (style.position === 'static') {
        target.style.position = 'relative';
      }
      target.style.overflow = 'hidden';

      // Remove existing ripples to prevent overwhelming DOM
      const existingRipple = target.querySelector('.global-ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      target.appendChild(circle);
      
      // Trigger haptic feedback
      import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));

      // Cleanup after animation finishes
      setTimeout(() => {
        circle.remove();
      }, 600); // match duration
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  return null;
}
