import {CapacitorConfig} from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'com.findyourking.app',
    appName: 'Find Your King',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: "#0a0a0a",
            showSpinner: true,
            spinnerStyle: "circular",
            spinnerColor: "#8b5cf6",
        },
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"]
        },
        Camera: {
            permissions: ["camera", "photos"]
        },
        Haptics: {
            enabled: true
        },
        Filesystem: {
            permissions: ["storage"]
        },
        Share: {
            enabled: true
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0a0a0a'
        },
        App: {
            appendUserAgent: 'Find Your KingDating/1.0.0'
        }
    }
}

export default config