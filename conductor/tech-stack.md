# Technology Stack: Social Vinyl Mobile

## Core Platform
- **Framework:** [Expo](https://expo.dev/) (React Native Managed Workflow)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Architecture:** Satellite Repo (Real-time connection to Java Mothership)

## UI & Interaction
- **Aesthetic:** Modern Glassmorphism (Frosted glass, gradients)
- **Blur Effects:** `expo-blur`
- **Haptics:** `expo-haptics`
- **Gradients:** `expo-linear-gradient`
- **Animations:** `react-native-reanimated` (60fps fluid motion)

## Engineering & State
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Lightweight, atomic updates for the Message Router pattern)
- **Real-time Networking:** Native WebSockets (connecting to `ws://[server]/listening-bin`)
- **Offline Persistence:** `expo-sqlite` (Local caching of Discogs metadata and art)
- **Navigation:** `expo-router` (File-based routing)

## Development Tooling
- **Build System:** Expo EAS (Cloud builds for iOS/Android)
- **Client Testing:** Expo Go (Instant physical device preview)
