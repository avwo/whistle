module.exports = {
    "env": {
        "browser": true,
        "node": true
    },
    "extends": "eslint:recommended",
    parser: 'babel-eslint',
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        }
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars": [
          "error",
          {
            "vars": "all",
            "args": "none"
          }
        ],
        "no-empty": [
              "error",
              { "allowEmptyCatch": true }
        ],
        "no-cond-assign": "off"
    }
};
