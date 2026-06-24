import neostandard from 'neostandard'

export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    }
  },

  ...neostandard({
    env: ['browser', 'node'],
    ignores: [
      'coverage/**',
      'dist/**',
      'doc/**'
    ]
  }),

  {
    rules: {
      '@stylistic/array-bracket-spacing': 'off',
      '@stylistic/brace-style': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/key-spacing': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/no-mixed-operators': 'off',
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/padded-blocks': 'off',
      '@stylistic/semi': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/space-infix-ops': 'off',
      '@stylistic/space-unary-ops': 'off',
      '@stylistic/spaced-comment': 'off',
      camelcase: 'off',
      'no-labels': 'off',
      'no-prototype-builtins': 'off',
      'no-useless-return': 'off',
      'no-var': 'off',
      'object-shorthand': 'off',
      'one-var': 'off',
      'prefer-const': 'off'
    }
  }
]
