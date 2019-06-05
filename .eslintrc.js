module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "Util": "readonly",
        "Twitch": "readonly",
        "TwitchClient": "readonly",
        "TwitchEvent": "readonly",
        "TwitchChatEvent": "readonly",
        "TwitchSubEvent": "readonly",
        "HTMLGenerator": "readonly",
        "Plugins": "readonly",
        "Content": "readonly",
        "ChatCommands": "readwrite",
        "InitChatCommands": "readonly",
        "GIT_URL": "readonly",
        "CUR_URL": "readonly",
        "GetLayout": "readonly",
        "ParseLayout": "readonly",
        "FormatLayout": "readonly",
        "CSSCheerStyles": "readonly",
        "GetCheerStyle": "readonly",
        "Strings": "readonly",
        "AssetPaths": "readonly",
        "client_main": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "eqeqeq": "warn",
        "no-shadow": "warn",
        "no-trailing-spaces": "warn",
        'no-unused-vars': ['warn', {
            args: 'none',
            ignoreRestSiblings: true
        }],
        "no-implied-eval": "warn",
        "no-self-compare": "warn",
        "no-throw-literal": "warn",
        "no-unused-expressions": "warn",
        "semi": "warn",
        "no-self-compare": "warn",
        "no-param-reassign": "warn",
        "no-lonely-if": "warn",
        "no-tabs": "error"
    },
    "overrides": [
        {
            "files": ["main.js"],
            "rules": {
                "no-console": "off"
            }
        },
        {
            "files": ["htmlgen.js"],
            "rules": {
                "no-param-reassign": "off"
            }
        }
    ]
};
