'use client'

// ============================================
// i18n CONFIGURATION - Multi-language support
// ============================================

import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
    en: {
        translation: {
            // Common
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.search': 'Search',
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',

            // Auth
            'auth.login': 'Sign In',
            'auth.register': 'Sign Up',
            'auth.logout': 'Sign Out',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.forgotPassword': 'Forgot Password?',

            // Dating
            'dating.like': 'Like',
            'dating.pass': 'Pass',
            'dating.superLike': 'Super Like',
            'dating.match': "It's a Match!",
            'dating.noMore': 'No more profiles',
            'dating.distance': '{{km}} km away',

            // Chat
            'chat.sendMessage': 'Send Message',
            'chat.translate': 'Translate',
            'chat.voiceNote': 'Voice Note',
            'chat.typing': 'typing...',
            'chat.online': 'Online',
            'chat.offline': 'Offline',
            'chat.lastSeen': 'Last seen {{time}}',

            // Video
            'video.call': 'Video Call',
            'video.end': 'End Call',
            'video.mute': 'Mute',
            'video.unmute': 'Unmute',
            'video.camera': 'Camera',
            'video.screenShare': 'Share Screen',

            // Profile
            'profile.edit': 'Edit Profile',
            'profile.settings': 'Settings',
            'profile.matches': 'Matches',
            'profile.likes': 'Likes',
            'profile.visitors': 'Visitors',

            // Events
            'events.create': 'Create Event',
            'events.join': 'Join Event',
            'events.leave': 'Leave Event',
            'events.attendees': '{{count}} attending',

            // AI Features
            'ai.smartReply': 'AI Smart Reply',
            'ai.translate': 'AI Translate',
            'ai.voiceToText': 'Voice to Text',
            'ai.sentiment': 'Message Tone',
        }
    },
    es: {
        translation: {
            'common.save': 'Guardar',
            'common.cancel': 'Cancelar',
            'common.delete': 'Eliminar',
            'common.edit': 'Editar',
            'common.search': 'Buscar',
            'common.loading': 'Cargando...',
            'auth.login': 'Iniciar Sesión',
            'auth.register': 'Registrarse',
            'auth.logout': 'Cerrar Sesión',
            'dating.like': 'Me Gusta',
            'dating.pass': 'Pasar',
            'dating.superLike': 'Super Like',
            'dating.match': '¡Es un Match!',
            'chat.sendMessage': 'Enviar Mensaje',
            'chat.translate': 'Traducir',
            'video.call': 'Videollamada',
            'video.end': 'Terminar Llamada',
            'profile.edit': 'Editar Perfil',
            'events.create': 'Crear Evento',
        }
    },
    fr: {
        translation: {
            'common.save': 'Enregistrer',
            'common.cancel': 'Annuler',
            'common.delete': 'Supprimer',
            'common.edit': 'Modifier',
            'common.search': 'Rechercher',
            'common.loading': 'Chargement...',
            'auth.login': 'Se Connecter',
            'auth.register': "S'inscrire",
            'auth.logout': 'Se Déconnecter',
            'dating.like': 'J\'aime',
            'dating.pass': 'Passer',
            'dating.superLike': 'Super Like',
            'dating.match': "C'est un Match!",
            'chat.sendMessage': 'Envoyer le Message',
            'chat.translate': 'Traduire',
            'video.call': 'Appel Vidéo',
            'video.end': 'Terminer l\'Appel',
            'profile.edit': 'Modifier le Profil',
            'events.create': 'Créer un Événement',
        }
    },
    de: {
        translation: {
            'common.save': 'Speichern',
            'common.cancel': 'Abbrechen',
            'common.delete': 'Löschen',
            'common.edit': 'Bearbeiten',
            'common.search': 'Suchen',
            'common.loading': 'Laden...',
            'auth.login': 'Anmelden',
            'auth.register': 'Registrieren',
            'auth.logout': 'Abmelden',
            'dating.like': 'Mag ich',
            'dating.pass': 'Überspringen',
            'dating.superLike': 'Super Like',
            'dating.match': 'Es ist ein Match!',
            'chat.sendMessage': 'Nachricht Senden',
            'chat.translate': 'Übersetzen',
            'video.call': 'Videoanruf',
            'video.end': 'Anruf Beenden',
            'profile.edit': 'Profil Bearbeiten',
            'events.create': 'Event Erstellen',
        }
    },
    zh: {
        translation: {
            'common.save': '保存',
            'common.cancel': '取消',
            'common.delete': '删除',
            'common.edit': '编辑',
            'common.search': '搜索',
            'common.loading': '加载中...',
            'auth.login': '登录',
            'auth.register': '注册',
            'auth.logout': '退出',
            'dating.like': '喜欢',
            'dating.pass': '跳过',
            'dating.superLike': '超级喜欢',
            'dating.match': '配对成功！',
            'chat.sendMessage': '发送消息',
            'chat.translate': '翻译',
            'video.call': '视频通话',
            'video.end': '结束通话',
            'profile.edit': '编辑资料',
            'events.create': '创建活动',
        }
    },
    ja: {
        translation: {
            'common.save': '保存',
            'common.cancel': 'キャンセル',
            'common.delete': '削除',
            'common.edit': '編集',
            'common.search': '検索',
            'common.loading': '読み込み中...',
            'auth.login': 'ログイン',
            'auth.register': '登録',
            'auth.logout': 'ログアウト',
            'dating.like': 'いいね',
            'dating.pass': 'スキップ',
            'dating.superLike': 'スーパーライク',
            'dating.match': 'マッチしました！',
            'chat.sendMessage': 'メッセージを送信',
            'chat.translate': '翻訳',
            'video.call': 'ビデオ通話',
            'video.end': '通話を終了',
            'profile.edit': 'プロフィールを編集',
            'events.create': 'イベントを作成',
        }
    }
}

if (!i18n.isInitialized) {
    i18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            resources,
            fallbackLng: 'en',
            debug: process.env.NODE_ENV === 'development',
            interpolation: {
                escapeValue: false,
            },
            detection: {
                order: ['localStorage', 'navigator', 'htmlTag'],
                caches: ['localStorage'],
            },
        })
}

export default i18n
