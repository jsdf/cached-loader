module.exports = {
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    "no-console": 0,
    "no-shadow": 2,
    // style
    "semi": 2,
    "no-extra-semi": 2,
    "no-multi-spaces": 2,
    "array-bracket-spacing": 2,
    "block-spacing": 2,
    "comma-spacing": 2,
    "comma-dangle": [2, "always-multiline"],
    "computed-property-spacing": 2,
    "eol-last": 2,
    "indent": [2, 2],
    "keyword-spacing": 2,
    "linebreak-style": 2,
    "no-spaced-func": 2,
    "no-trailing-spaces": 2,
    "object-curly-spacing": 2,
    "quotes": [2, "single", "avoid-escape"],
    "semi": 2,
    "semi-spacing": 2,
    "space-before-blocks": 2,
    "space-before-function-paren": [2, "never"],
    "space-in-parens": 2,
    "space-infix-ops": 2,
    "space-unary-ops": 2,
    "arrow-spacing": 2,
    "generator-star-spacing": 2,
    "template-curly-spacing": 2,
    "yield-star-spacing": 2,
  }
};
