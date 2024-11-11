const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function plugin(c) {
  return withAndroidManifest(c, (config) => {
    let androidManifest = config.modResults.manifest;
    androidManifest.queries.push({
      package: {
        $: {
          "android:name": "com.instagram.android",
        },
      },
    });
    return config;
  });
};
