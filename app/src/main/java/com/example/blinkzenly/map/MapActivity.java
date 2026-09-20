package com.example.blinkzenly.map;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Build;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.target.CustomTarget;
import com.bumptech.glide.request.transition.Transition;
import com.example.blinkzenly.R;
import com.example.blinkzenly.chat.ChatListActivity;
import com.example.blinkzenly.marks.AddMarkActivity;
import com.example.blinkzenly.model.LocationPoint;
import com.example.blinkzenly.model.MarkModel;
import com.example.blinkzenly.model.ReactionModel;
import com.example.blinkzenly.model.User;
import com.example.blinkzenly.route.RouteActivity;
import com.example.blinkzenly.status.StatusActivity;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.HashMap;
import java.util.Map;

/**
 * Главный экран: карта друзей (п.2), реакции по тапу на аватар (п.3),
 * метки с фото (п.4), текущий статус в шапке (п.5), переходы в чаты (п.6),
 * уведомления включаются автоматически через FCM (п.7), встречи/маршруты (п.8).
 */
public class MapActivity extends FragmentActivity implements OnMapReadyCallback {

    private static final int REQ_LOCATION = 100;

    private GoogleMap map;
    private final Map<String, Marker> friendMarkers = new HashMap<>();
    private TextView tvMyStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_map);

        tvMyStatus = findViewById(R.id.tvMyStatus);

        findViewById(R.id.btnStatus).setOnClickListener(v ->
                startActivity(new Intent(this, StatusActivity.class)));
        findViewById(R.id.btnAddMark).setOnClickListener(v ->
                startActivity(new Intent(this, AddMarkActivity.class)));
        findViewById(R.id.btnChats).setOnClickListener(v ->
                startActivity(new Intent(this, ChatListActivity.class)));
        findViewById(R.id.btnMeet).setOnClickListener(v ->
                startActivity(new Intent(this, RouteActivity.class)));

        SupportMapFragment mapFragment = (SupportMapFragment)
                getSupportFragmentManager().findFragmentById(R.id.mapFragment);
        if (mapFragment != null) mapFragment.getMapAsync(this);

        loadMyStatus();
        requestLocationPermissions();
    }

    private void requestLocationPermissions() {
        boolean fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        if (!fine) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
        } else {
            startLocationServiceAndMap();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_LOCATION && results.length > 0
                && results[0] == PackageManager.PERMISSION_GRANTED) {
            startLocationServiceAndMap();
        } else {
            Toast.makeText(this, "Без доступа к геолокации карта друзей работать не будет", Toast.LENGTH_LONG).show();
        }
    }

    private void startLocationServiceAndMap() {
        Intent svc = new Intent(this, LocationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(svc);
        else startService(svc);

        if (map != null) {
            try {
                map.setMyLocationEnabled(true);
            } catch (SecurityException ignored) {}
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        map = googleMap;
        try { map.setMyLocationEnabled(true); } catch (SecurityException ignored) {}

        listenFriendsLocations();
        listenMarks();

        map.setOnMarkerClickListener(marker -> {
            Object tag = marker.getTag();
            if (tag instanceof String) {
                showReactionPicker((String) tag);
                return true;
            }
            return false;
        });
    }

    /** П.2 Гео: подписка на позиции друзей в Realtime DB, обновление маркеров на карте. */
    private void listenFriendsLocations() {
        FirebaseUtil.realtimeDb().getReference("locations")
                .addChildEventListener(new ChildEventListener() {
                    @Override
                    public void onChildAdded(DataSnapshot s, String prev) { updateFriend(s); }
                    @Override
                    public void onChildChanged(DataSnapshot s, String prev) { updateFriend(s); }
                    @Override
                    public void onChildRemoved(DataSnapshot s) {}
                    @Override
                    public void onChildMoved(DataSnapshot s, String prev) {}
                    @Override
                    public void onCancelled(DatabaseError error) {}
                });
    }

    private void updateFriend(DataSnapshot snapshot) {
        String friendUid = snapshot.getKey();
        if (friendUid == null || friendUid.equals(FirebaseUtil.uid())) return; // себя не дублируем
        LocationPoint point = snapshot.getValue(LocationPoint.class);
        if (point == null) return;

        LatLng pos = new LatLng(point.lat, point.lng);

        FirebaseFirestore.getInstance().collection("users").document(friendUid).get()
                .addOnSuccessListener(doc -> {
                    User user = doc.toObject(User.class);
                    String title = user != null ? user.name : "Друг";
                    String avatarUrl = user != null ? user.avatarUrl : null;

                    if (friendMarkers.containsKey(friendUid)) {
                        friendMarkers.get(friendUid).setPosition(pos);
                    } else if (avatarUrl != null && !avatarUrl.isEmpty()) {
                        loadRoundMarker(avatarUrl, friendUid, pos, title);
                    } else {
                        Marker m = map.addMarker(new MarkerOptions().position(pos).title(title)
                                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)));
                        if (m != null) m.setTag(friendUid);
                        friendMarkers.put(friendUid, m);
                    }
                });
    }

    private void loadRoundMarker(String url, String friendUid, LatLng pos, String title) {
        Glide.with(this).asBitmap().load(url).circleCrop()
                .into(new CustomTarget<Bitmap>(120, 120) {
                    @Override
                    public void onResourceReady(Bitmap resource, Transition<? super Bitmap> t) {
                        BitmapDescriptor icon = BitmapDescriptorFactory.fromBitmap(resource);
                        Marker m = map.addMarker(new MarkerOptions().position(pos).title(title).icon(icon));
                        if (m != null) m.setTag(friendUid);
                        friendMarkers.put(friendUid, m);
                    }
                    @Override
                    public void onLoadCleared(android.graphics.drawable.Drawable placeholder) {}
                });
    }

    /** П.3 Реакции: простой диалог выбора эмодзи, отправка "стикера" другу. */
    private void showReactionPicker(String friendUid) {
        String[] emojis = {"👋", "❤️", "😂", "🔥", "👀"};
        new android.app.AlertDialog.Builder(this)
                .setTitle("Отправить реакцию")
                .setItems(emojis, (dialog, which) -> sendReaction(friendUid, emojis[which]))
                .show();
    }

    private void sendReaction(String toUid, String emoji) {
        String fromUid = FirebaseUtil.uid();
        ReactionModel reaction = new ReactionModel(fromUid, toUid, emoji, System.currentTimeMillis());
        FirebaseUtil.firestore().collection("reactions").add(reaction);
        // Облачная функция (см. README) слушает /reactions и шлёт push через FCM получателю.
        Toast.makeText(this, "Отправлено " + emoji, Toast.LENGTH_SHORT).show();
    }

    /** П.4 Метки и фото: слушаем коллекцию marks и рисуем на карте миниатюры фото. */
    private void listenMarks() {
        FirebaseUtil.firestore().collection("marks")
                .addSnapshotListener((snapshots, e) -> {
                    if (snapshots == null) return;
                    for (com.google.firebase.firestore.DocumentChange change : snapshots.getDocumentChanges()) {
                        if (change.getType() == com.google.firebase.firestore.DocumentChange.Type.ADDED) {
                            MarkModel mark = change.getDocument().toObject(MarkModel.class);
                            addMarkToMap(mark);
                        }
                    }
                });
    }

    private void addMarkToMap(MarkModel mark) {
        LatLng pos = new LatLng(mark.lat, mark.lng);
        if (mark.photoUrl != null && !mark.photoUrl.isEmpty()) {
            Glide.with(this).asBitmap().load(mark.photoUrl)
                    .into(new CustomTarget<Bitmap>(140, 140) {
                        @Override
                        public void onResourceReady(Bitmap resource, Transition<? super Bitmap> t) {
                            map.addMarker(new MarkerOptions().position(pos).title(mark.title)
                                    .icon(BitmapDescriptorFactory.fromBitmap(resource)));
                        }
                        @Override
                        public void onLoadCleared(android.graphics.drawable.Drawable placeholder) {}
                    });
        } else {
            map.addMarker(new MarkerOptions().position(pos).title(mark.title)
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE)));
        }
    }

    /** П.5 Статусы: показать текущий статус в шапке карты. */
    private void loadMyStatus() {
        String uid = FirebaseUtil.uid();
        if (uid == null) return;
        FirebaseUtil.firestore().collection("users").document(uid).get()
                .addOnSuccessListener(doc -> {
                    User u = doc.toObject(User.class);
                    if (u != null && u.statusText != null) {
                        tvMyStatus.setText((u.statusEmoji != null ? u.statusEmoji + " " : "") + u.statusText);
                    }
                });
    }
}
