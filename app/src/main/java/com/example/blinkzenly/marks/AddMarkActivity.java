package com.example.blinkzenly.marks;

import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;
import com.example.blinkzenly.databinding.ActivityAddMarkBinding;
import com.example.blinkzenly.model.MarkModel;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.android.gms.location.LocationServices;

/**
 * П.4 Метки и фотки: пользователь выбирает фото, вводит подпись,
 * фото грузится в Firebase Storage, метка с координатами (текущими) — в Firestore/marks.
 */
public class AddMarkActivity extends AppCompatActivity {

    private ActivityAddMarkBinding b;
    private Uri pickedImage;

    private final ActivityResultLauncher<String> pickImage =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (uri != null) {
                    pickedImage = uri;
                    Glide.with(this).load(uri).into(b.ivPreview);
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityAddMarkBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        b.btnPickPhoto.setOnClickListener(v -> pickImage.launch("image/*"));
        b.btnSaveMark.setOnClickListener(v -> saveMark());
    }

    private void saveMark() {
        String title = b.etMarkTitle.getText().toString().trim();
        if (title.isEmpty()) {
            Toast.makeText(this, "Введите название метки", Toast.LENGTH_SHORT).show();
            return;
        }

        LocationServices.getFusedLocationProviderClient(this).getLastLocation()
                .addOnSuccessListener(this::uploadWithLocation);
    }

    private void uploadWithLocation(Location location) {
        if (location == null) {
            Toast.makeText(this, "Не удалось определить местоположение", Toast.LENGTH_SHORT).show();
            return;
        }
        String title = b.etMarkTitle.getText().toString().trim();
        String uid = FirebaseUtil.uid();
        long ts = System.currentTimeMillis();

        if (pickedImage == null) {
            persistMark(new MarkModel(uid, title, null, location.getLatitude(), location.getLongitude(), ts));
            return;
        }

        String path = "marks/" + uid + "/" + ts + ".jpg";
        var ref = FirebaseUtil.storage().getReference().child(path);
        ref.putFile(pickedImage)
                .continueWithTask(task -> ref.getDownloadUrl())
                .addOnSuccessListener(downloadUri -> {
                    MarkModel mark = new MarkModel(uid, title, downloadUri.toString(),
                            location.getLatitude(), location.getLongitude(), ts);
                    persistMark(mark);
                })
                .addOnFailureListener(e -> Toast.makeText(this, "Ошибка загрузки фото: " + e.getMessage(), Toast.LENGTH_LONG).show());
    }

    private void persistMark(MarkModel mark) {
        FirebaseUtil.firestore().collection("marks").add(mark)
                .addOnSuccessListener(doc -> {
                    Toast.makeText(this, "Метка добавлена", Toast.LENGTH_SHORT).show();
                    finish();
                })
                .addOnFailureListener(e -> Toast.makeText(this, "Ошибка: " + e.getMessage(), Toast.LENGTH_SHORT).show());
    }
}
