package com.example.blinkzenly.model;

/**
 * Сообщение в чате. Firestore: chats/{chatId}/messages/{autoId}
 * type = TEXT | CIRCLE (круглое видео-сообщение, как в Telegram)
 */
public class ChatMessage {
    public static final String TYPE_TEXT = "TEXT";
    public static final String TYPE_CIRCLE = "CIRCLE";

    public String id;
    public String fromUid;
    public String type;
    public String text;        // для TYPE_TEXT
    public String mediaUrl;    // для TYPE_CIRCLE — ссылка на видео в Storage
    public int durationMs;     // длительность кружочка
    public long timestamp;

    public ChatMessage() {}

    public static ChatMessage text(String fromUid, String text, long ts) {
        ChatMessage m = new ChatMessage();
        m.fromUid = fromUid;
        m.type = TYPE_TEXT;
        m.text = text;
        m.timestamp = ts;
        return m;
    }

    public static ChatMessage circle(String fromUid, String mediaUrl, int durationMs, long ts) {
        ChatMessage m = new ChatMessage();
        m.fromUid = fromUid;
        m.type = TYPE_CIRCLE;
        m.mediaUrl = mediaUrl;
        m.durationMs = durationMs;
        m.timestamp = ts;
        return m;
    }
}
