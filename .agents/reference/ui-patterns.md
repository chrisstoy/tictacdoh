---
name: ui-patterns
description: Styling with NativeWind and the custom color palette, component conventions, animation, and image wrappers.
---

# UI Patterns

- **Styling:** NativeWind 4 (Tailwind 3 `className` on RN components); content glob `./src/**/*.{js,jsx,ts,tsx}`; `darkMode: 'class'` but app is light-only (`userInterfaceStyle: 'light'`). Custom plugin in `nativewind.plugin.js`.
- **Palette** (`tailwind.config.js`, semantic names): `background` #fdde97 (soft yellow), `border` #632f16 (dark line art), `text` #2b262c, `highlight` #c46f24 (active player). Splash/theme color matches `background`.
- **Layout:** root view is capped at `max-w-[30em] max-h-[60em]` and centered, so web renders as a phone-sized column.
- **Images:** each `assets/*.png` is wrapped by a component in `src/components/images/` (`XImage`, `OImage`, ...). Add a wrapper rather than importing PNGs inline.
- **Buttons/text:** `PushButton`, `JiggleButton`, `Toggle`, `OutlineText`, `TextWithBackground` are the shared primitives; animations (`src/animations/`) use react-native-reanimated 4 (`FadeIn`/`FadeOut` between screens).
- **Fonts:** Komigo3D, loaded via expo-font from `assets/fonts/`.
- **Debug:** `DebugViewData.tsx` for inspecting state.
