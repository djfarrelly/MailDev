module.exports = (ctx) => ({
  plugins: {
    'postcss-import': {},
    'tailwindcss': {},
    'postcss-preset-env': {},
    'cssnano': ctx.env === 'production' ? {} : false,
  },
})