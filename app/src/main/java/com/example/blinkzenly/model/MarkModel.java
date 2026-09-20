package com.example.blinkzenly.model;

/**
 * Метка на карте с фотографией (кафе, событие, точка встречи).
 * Firestore: marks/{autoId}, фото — в Firebase Storage marks/{uid}/{timestamp}.jpg
 */
public class MarkModel {
    public String id;
    public String ownerUid;
    public String title;
    public String photoUrl;
    public double lat;
    public double lng;
    public long timestamp;

    public MarkModel() {}

    public MarkModel(String ownerUid, String title, String photoUrl, double lat, double lng, long timestamp) {
        this.ownerUid = ownerUid;
        this.title = title;
        this.photoUrl = photoUrl;
        this.lat = lat;
        this.lng = lng;
        this.timestamp = timestamp;
    }
}
