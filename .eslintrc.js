module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    // Visible "// label" copy is brand voice, not a JavaScript comment.
    'react/jsx-no-comment-textnodes': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};
