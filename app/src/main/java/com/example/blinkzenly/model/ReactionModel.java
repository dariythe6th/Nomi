package com.example.blinkzenly.model;

/**
 * Реакция одного пользователя на другого (эмодзи прилетает "стикером" на карту).
 * Firestore: reactions/{autoId}
 */
public class ReactionModel {
    public String fromUid;
    public String toUid;
    public String emoji;   // "👋", "❤️", "😂" и т.д.
    public long timestamp;

    public ReactionModel() {}

    public ReactionModel(String fromUid, String toUid, String emoji, long timestamp) {
        this.fromUid = fromUid;
        this.toUid = toUid;
        this.emoji = emoji;
        this.timestamp = timestamp;
    }
}
