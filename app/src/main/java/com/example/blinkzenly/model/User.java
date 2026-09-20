package com.example.blinkzenly.model;

/**
 * Профиль пользователя. Хранится в Firestore: users/{uid}
 */
public class User {
    public String uid;
    public String name;
    public String avatarUrl;
    public String statusText;   // текущий статус, п.5
    public String statusEmoji;
    public double lastLat;      // последняя геопозиция, п.2
    public double lastLng;
    public long lastSeen;
    public boolean shareLocation = true;

    public User() {}

    public User(String uid, String name) {
        this.uid = uid;
        this.name = name;
    }
}
