# BlinkZenly — клон Blink/Zenly на Java (Android)

Каркас мобильного приложения, закрывающий все требуемые пункты:

| № | Функция | Где реализовано |
|---|---|---|
| 1 | Авторизация | `auth/LoginActivity`, `auth/RegisterActivity` (Firebase Auth) |
| 2 | Гео | `map/LocationService` + `map/MapActivity` (Realtime Database) |
| 3 | Реакции | `MapActivity.showReactionPicker/sendReaction`, `model/ReactionModel` |
| 4 | Метки и фотки | `marks/AddMarkActivity`, `model/MarkModel` (Firebase Storage) |
| 5 | Статусы | `status/StatusActivity`, поля `User.statusText/statusEmoji` |
| 6 | Чаты + кружочки | `chat/ChatListActivity`, `chat/ChatActivity`, `chat/CircleRecordActivity`, `chat/CircleVideoView`, `chat/CircleCameraPreview` |
| 7 | Уведомления | `notifications/MyFirebaseMessagingService`, `notifications/NotificationHelper` |
| 8 | Маршруты (встреча) | `route/RouteActivity`, `model/RouteMeeting` |

## Архитектура
- **Backend = Firebase** (без своего сервера): Auth, Firestore (профили, реакции, метки, чаты, встречи), Realtime Database (live-координаты — низкая задержка), Storage (фото и видео-кружочки), Cloud Messaging (push).
- **Карта** — Google Maps SDK for Android + Directions API для построения маршрута к точке встречи.
- **Кружочки** — запись через CameraX (`VideoCapture`), круглая маска через `Canvas.clipPath` и на превью (`CircleCameraPreview`), и на воспроизведении (`CircleVideoView`).

## Как запустить

1. Откройте папку `BlinkZenlyClone` в Android Studio (Giraffe/Koala и новее).
2. Создайте проект в [Firebase Console](https://console.firebase.google.com/), добавьте Android-приложение с `applicationId = com.example.blinkzenly`, скачайте `google-services.json` и положите в `app/`.
3. В Firebase Console включите:
   - **Authentication** → Email/Password.
   - **Firestore Database** (в тестовом режиме на старте).
   - **Realtime Database**.
   - **Storage**.
   - **Cloud Messaging**.
4. Получите ключ **Google Maps SDK + Directions API** в [Google Cloud Console](https://console.cloud.google.com/) и вставьте его вместо `ВАШ_GOOGLE_MAPS_API_KEY`:
   - `AndroidManifest.xml` (meta-data `com.google.android.geo.API_KEY`)
   - `route/RouteActivity.java` (константа `DIRECTIONS_API_KEY`)
5. Соберите и запустите (`Run ▶`). При первом запуске приложение попросит доступ к геолокации.
6. Иконку приложения (`@mipmap/ic_launcher`) сгенерируйте через **Image Asset Studio** (ПКМ на `res` → New → Image Asset) — в макете сейчас она не включена намеренно, чтобы вы использовали свой дизайн.

## Push-уведомления (п.7) — доотправка через Cloud Function

Клиент только **принимает** push (`MyFirebaseMessagingService`) и хранит `fcmToken` в `users/{uid}`.
Чтобы реакции/сообщения/приглашения реально долетали как push, разверните лёгкую Cloud Function-триггер (Node.js, отдельно от Android-кода), которая слушает:
- создание документа в `reactions/` → шлёт push получателю (`toUid`) через Admin SDK `messaging().send()`,
- создание сообщения в `chats/{chatId}/messages/` → шлёт push второму участнику чата,
- создание документа в `meetings/` → шлёт push участникам `participants`.

Это стандартная связка "Firestore trigger → Admin SDK FCM send", отдельный сервис, не входящий в APK.

## Структура Firestore/Realtime DB

```
users/{uid}            -> User (name, avatarUrl, statusText, statusEmoji, lastLat/lastLng, fcmToken)
locations/{uid}         -> LocationPoint (Realtime DB, live-координаты)
reactions/{autoId}      -> ReactionModel (fromUid, toUid, emoji)
marks/{autoId}          -> MarkModel (title, photoUrl, lat, lng)
chats/{chatId}          -> { participants: [uid1, uid2] }
chats/{chatId}/messages/{autoId} -> ChatMessage (type=TEXT|CIRCLE)
meetings/{autoId}       -> RouteMeeting (destLat/destLng, participants, meetAt)
```

## Что доработать под свою защиту
- Экран выбора друга при создании чата/встречи (сейчас демо-заглушка с фиктивным uid).
- Правила безопасности Firestore/Storage/Realtime DB (`security rules`) — сейчас предполагается тестовый режим.
- Список друзей/заявок в друзья, если требуется в презентации.
- Полноценная иконка приложения и брендинг.
