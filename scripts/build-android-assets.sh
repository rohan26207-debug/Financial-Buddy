#!/usr/bin/env bash
# Build the React app and sync it into the Android assets folder.
# Usage: bash scripts/build-android-assets.sh
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ANDROID_ASSETS="$ROOT_DIR/android/app/src/main/assets"

echo "==> Building frontend (production)"
cd "$FRONTEND_DIR"
yarn install --frozen-lockfile
PUBLIC_URL=. yarn build

echo "==> Cleaning Android assets folder"
rm -rf "$ANDROID_ASSETS"
mkdir -p "$ANDROID_ASSETS"

echo "==> Copying build into Android assets"
cp -R "$FRONTEND_DIR/build/." "$ANDROID_ASSETS/"

echo "==> Done. Open /app/android in Android Studio and Build > Build APK(s)."
echo "   Output APK: android/app/build/outputs/apk/<variant>/app-*.apk"
