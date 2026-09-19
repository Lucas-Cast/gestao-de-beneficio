/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background1: 'var(--color-background1)',
        background2: 'var(--color-background2)',
        background3: 'var(--color-background3)',
        backgroundSelected: 'var(--color-backgroundSelected)',
        foreground: 'var(--color-foreground)',
        foregroundStrong: 'var(--color-foreground-strong)',
        text: 'var(--color-text)',
        textOnBackground2: 'var(--color-textOnBackground2)',
        textSecondary: 'var(--color-text-secondary)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontSize: {
        body: ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-sm-bold': ['14px', { lineHeight: '20px', fontWeight: '700' }],
        title: ['48px', { lineHeight: '52px', fontWeight: '600' }],
        subtitle: ['32px', { lineHeight: '44px', fontWeight: '600' }],
        link: ['14px', { lineHeight: '30px' }],
        code: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      screens: {
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};
