import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.travel.log",
  appName: "Travel Log",

  webDir: "public",

  server: {
    url: "https://travel-log-psi-five.vercel.app/",
    cleartext: false,
  },
};

export default config;