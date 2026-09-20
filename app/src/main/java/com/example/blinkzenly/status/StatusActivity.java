package com.example.blinkzenly.status;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.blinkzenly.databinding.ActivityStatusBinding;
import com.example.blinkzenly.util.FirebaseUtil;

import java.util.HashMap;
import java.util.Map;

/**
 * П.5 Статусы: пользователь выбирает эмодзи + короткий текст ("на учёбе", "гуляю", "занят").
 * Сохраняется в users/{uid}.statusText / statusEmoji и виден друзьям на карте (тултип маркера).
 */
public class StatusActivity extends AppCompatActivity {

    private ActivityStatusBinding b;
    private String selectedEmoji = "🙂";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityStatusBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        String[] emojis = {"🙂", "📚", "🏃", "🚗", "☕", "😴", "🎉"};
        for (String e : emojis) {
            android.widget.Button btn = new android.widget.Button(this);
            btn.setText(e);
            btn.setOnClickListener(v -> {
                selectedEmoji = e;
                b.tvSelectedEmoji.setText(e);
            });
            b.emojiRow.addView(btn);
        }

        b.btnSaveStatus.setOnClickListener(v -> saveStatus());
    }

    private void saveStatus() {
        String text = b.etStatusText.getText().toString().trim();
        String uid = FirebaseUtil.uid();
        if (uid == null) return;

        Map<String, Object> update = new HashMap<>();
        update.put("statusText", text);
        update.put("statusEmoji", selectedEmoji);

        FirebaseUtil.firestore().collection("users").document(uid)
                .update(update)
                .addOnSuccessListener(v -> {
                    Toast.makeText(this, "Статус обновлён", Toast.LENGTH_SHORT).show();
                    finish();
                })
                .addOnFailureListener(e -> Toast.makeText(this, "Ошибка: " + e.getMessage(), Toast.LENGTH_SHORT).show());
    }
}
