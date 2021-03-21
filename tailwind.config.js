module.exports = {
  purge: {
    content: ['index.html'],
    options: {
      keyframes: true,
    },
  },
  darkMode: false,
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4994ce',
          dark: '#2e75ac',
        },
        github: {
          btn: '#fafbfc',
          'btn-hover': '#f3f4f6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Ubuntu',
          'Cantarell',
          'Noto Sans',
          'sans-serif',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: '#2e75ac',
              '&:hover': {
                color: '#4994ce',
              },
            },
          },
        },
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
