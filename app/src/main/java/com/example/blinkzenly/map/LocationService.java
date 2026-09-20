package com.example.blinkzenly.map;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.example.blinkzenly.R;
import com.example.blinkzenly.model.LocationPoint;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

/**
 * П.2 Гео. Foreground-сервис, который каждые ~5 сек публикует координаты
 * пользователя в Realtime Database (locations/{uid}) и зеркалит последнюю
 * позицию в Firestore users/{uid} (lastLat/lastLng/lastSeen).
 */
public class LocationService extends Service {

    public static final String CHANNEL_ID = "location_channel";

    private FusedLocationProviderClient client;
    private LocationCallback callback;

    @Override
    public void onCreate() {
        super.onCreate();
        client = LocationServices.getFusedLocationProviderClient(this);
        createChannel();
        startForeground(1, buildNotification());

        LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000)
                .setMinUpdateIntervalMillis(3000)
                .build();

        callback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                Location loc = result.getLastLocation();
                if (loc != null) publish(loc);
            }
        };

        try {
            client.requestLocationUpdates(request, callback, getMainLooper());
        } catch (SecurityException e) {
            stopSelf();
        }
    }

    private void publish(Location loc) {
        String uid = FirebaseUtil.uid();
        if (uid == null) return;

        long now = System.currentTimeMillis();
        LocationPoint point = new LocationPoint(loc.getLatitude(), loc.getLongitude(), loc.getSpeed(), now);

        FirebaseUtil.realtimeDb().getReference("locations").child(uid).setValue(point);

        FirebaseUtil.firestore().collection("users").document(uid)
                .update("lastLat", loc.getLatitude(),
                        "lastLng", loc.getLongitude(),
                        "lastSeen", now);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Геолокация", NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Геолокация активна")
                .setContentText("Друзья видят твоё местоположение")
                .setSmallIcon(R.drawable.ic_location)
                .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (client != null && callback != null) client.removeLocationUpdates(callback);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
