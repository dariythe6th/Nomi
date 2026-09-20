package com.example.blinkzenly.notifications;

import androidx.annotation.NonNull;

import com.example.blinkzenly.util.FirebaseUtil;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.HashMap;
import java.util.Map;

/**
 * П.7 Уведомления: получаем push от FCM (реакции, сообщения, кружочки,
 * приглашения на встречу — п.3,6,8) и показываем системное уведомление.
 * Токен устройства сохраняем в users/{uid}.fcmToken, чтобы Cloud Function
 * могла адресно отправлять push конкретному пользователю.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        String uid = FirebaseUtil.uid();
        if (uid == null) return;
        Map<String, Object> update = new HashMap<>();
        update.put("fcmToken", token);
        FirebaseUtil.firestore().collection("users").document(uid).update(update);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        super.onMessageReceived(message);
        String title = message.getData().getOrDefault("title",
                message.getNotification() != null ? String.valueOf(message.getNotification().getTitle()) : "BlinkZenly");
        String body = message.getData().getOrDefault("body",
                message.getNotification() != null ? String.valueOf(message.getNotification().getBody()) : "");
        NotificationHelper.show(this, title, body);
    }
}
