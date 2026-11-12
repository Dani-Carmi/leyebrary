# Leyebrary

A personal book library app for iOS (only with personal-ios build and TestFlight) and Android. Search for books, track your reading progress, and keep your library backed up — all stored locally on your device.

---

## Features

- **Library management**: browse your collection with search, filter by reading status, and sort by title or date added
- **Book search**: find books via the Google Books API and add them to your library
- **Search history and suggestions**: recent searches and books you've seen are suggested as you type; a search repeated within a day loads from the device instead of the API
- **Reading status**: mark books as _To Read_, _Reading_, or _Read_
- **Reading sessions**: log when you started and finished each read, including re-reads; the status follows your sessions
- **Tags and notes**: tag books (search them with `#tag`) and keep private notes per book
- **Import / Export**: back up and restore your entire library as a JSON file
- **Bring your own API key**: paste your own free Google Books key in Settings; it's stored only on your device
- **Offline-first**: data lives in a local SQLite database, no account required

- No comments / stars / reviews / social stuff

## Install (Android)

Leyebrary isn't on the Play Store. Download the APK from the GitHub Releases page and install it. Android will ask you to allow installs from your browser or file manager.

### Google Books API key

The APK doesn't include an API key. Without one, searches usually fail, but you can still import a library from a JSON backup. Getting your own key is free and takes a few minutes:

1. Open the [Books API page in Google Cloud Console](https://console.cloud.google.com/apis/library/books.googleapis.com) and sign in.
2. Create a project if asked (any name works), then press **Enable**.
3. Go to **APIs & Services → Credentials → Create credentials → API key**.
4. Recommended: edit the key and, under **API restrictions**, allow only the **Books API**.
5. In Leyebrary, open **Settings** (gear icon on the Home tab), paste the key and tap **Check & save**.

The key is checked with a single test request, then stored only on your device (Android Keystore / iOS Keychain). It is never sent anywhere except to Google Books.

## Tech Stack

- [Expo](https://expo.dev) (React Native) with file-based routing via Expo Router
- SQLite for local storage (`expo-sqlite`)
- Google Books API for book search
- TypeScript

## Building it yourself

```bash
npm install
npx expo start
```

To make an APK without any API key baked in, use the `public` EAS profile:

```bash
npm run build-public-apk
```

That profile sets `LEYEBRARY_PUBLIC_BUILD=true`, which makes `app.config.js` drop every Google Books key even if one is defined in your environment.

## License

[MIT](LICENSE)
