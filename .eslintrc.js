module.exports = {
    "env": {
        "node": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            2
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