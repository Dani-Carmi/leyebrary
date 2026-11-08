export default {
  expo: {
    name: "leyebrary",
    slug: "leyebrary",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/leyebrary-bg-logo.png",
    scheme: "leyebrary",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.leyebrary.leyebrary",
      backgroundColor: "#050304",
      icon: {
        light: "./assets/images/leyebrary-bg-logo.png",
        dark: "./assets/images/leyebrary-bg-logo.png",
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/leyebrary-logo.png",
        monochromeImage: "./assets/images/leyebrary-logo.png",
        backgroundColor: "#050304",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.leyebrary.leyebrary",
    },
    web: {
      output: "static",
      favicon: "./assets/images/leyebrary-logo.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-font",
        {
          fonts: [
            "node_modules/@expo-google-fonts/inter/900Black/Inter_900Black.ttf",
          ],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/leyebrary-logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#050304",
          dark: {
            backgroundColor: "#050304",
          },
        },
      ],
      [
        "expo-sqlite",
        {
          enableFTS: true,
          android: {
            // Override the shared configuration for Android
            enableFTS: false,
          },
          ios: {
            // You can also override the shared configurations for iOS
            customBuildFlags: [
              "-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1",
            ],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "1d57ba8f-4cbb-43eb-885d-3c2425106745",
      },
      // One key per platform: See services/googleBooksApi.ts for how each platform picks its key.
      googleBooksAndroidApiKey: process.env.GOOGLE_BOOKS_ANDROID_API_KEY,
      googleBooksIosApiKey: process.env.GOOGLE_BOOKS_IOS_API_KEY,
      googleBooksWebApiKey: process.env.GOOGLE_BOOKS_WEB_API_KEY,
      // SHA-1 of the Android signing certificate (not secret). Sent with
      // requests so an "Android apps"-restricted key accepts them.
      googleBooksAndroidCertSha1: process.env.GOOGLE_BOOKS_ANDROID_CERT_SHA1,
      googleBooksApiUrl: process.env.GOOGLE_BOOKS_API_URL,
    },
  },
};
