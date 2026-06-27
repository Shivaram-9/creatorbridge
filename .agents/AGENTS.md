# Project Deployment Rule

Whenever you make changes to the codebase, you MUST automatically execute the full deployment pipeline without waiting for the user to ask. 

The full pipeline includes:
1. Pushing to all 3 Git remotes: `origin main`, `company main`, and `production main`.
2. Syncing the Capacitor mobile build: `cd client && npm run build && cd .. && npx cap sync`.
3. Generating the Android APK and AAB binaries: `cd android && ./gradlew assembleDebug && ./gradlew bundleRelease`.

Command to run:
`git add . ; git commit -m "update" ; git push origin main ; git push company main ; git push production main ; cd client ; npm run build ; cd .. ; npx cap sync ; cd android ; ./gradlew assembleDebug ; ./gradlew bundleRelease`
