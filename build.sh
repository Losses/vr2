yarn

yarn ionic cap sync
# yarn ionic cap build ios
yarn ionic cap build android
cd android
sh ./gradlew clean
sh ./gradlew bundleRelease