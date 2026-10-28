# Expo Router Example

Use [`expo-router`](https://docs.expo.dev/router/introduction/) to build native navigation using files in the `app/` directory.

## Launch your own

[![Launch with Expo](https://github.com/expo/examples/blob/master/.gh-assets/launch.svg?raw=true)](https://launch.expo.dev/?github=https://github.com/expo/examples/tree/master/with-router)

## 🚀 How to use

```sh
npx create-expo-app -e with-router
```

## Deploy

The website stays a PWA on GitHub Pages at https://chrisstoy.github.io/tictacdoh/. Merging to `main` does not deploy; publish with the `deploy-app` skill.

iOS and Android are a Capacitor shell around the same web build. Signed release steps, signing inputs, and the store uploads that stay manual are in `.agents/skills/deploy-app/SKILL.md`.

## 📝 Notes

- [Expo Router: Docs](https://docs.expo.dev/router/introduction/)
