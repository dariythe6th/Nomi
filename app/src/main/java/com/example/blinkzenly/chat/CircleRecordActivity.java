package com.example.blinkzenly.chat;

import android.Manifest;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.video.FileOutputOptions;
import androidx.camera.video.Quality;
import androidx.camera.video.QualitySelector;
import androidx.camera.video.Recorder;
import androidx.camera.video.Recording;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.util.Consumer;

import com.example.blinkzenly.databinding.ActivityCircleRecordBinding;
import com.example.blinkzenly.model.ChatMessage;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.util.concurrent.ExecutionException;

/**
 * П.6 "Кружочки": экран записи круглого видео-сообщения (макс. 15 сек, как в Telegram/Instagram).
 * Пишем через CameraX VideoCapture, превью обрезаем в круг через CircleCameraPreview (XML),
 * готовый файл грузим в Storage и добавляем ChatMessage.TYPE_CIRCLE в чат.
 */
public class CircleRecordActivity extends AppCompatActivity {

    private static final int MAX_DURATION_MS = 15000;
    private static final int REQ_CAMERA = 200;

    private ActivityCircleRecordBinding b;
    private VideoCapture<Recorder> videoCapture;
    private Recording activeRecording;
    private String chatId;
    private final android.os.Handler timerHandler = new android.os.Handler();
    private long recordStart;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityCircleRecordBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());
        chatId = getIntent().getStringExtra("chatId");

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO}, REQ_CAMERA);
        } else {
            startCamera();
        }

        b.btnRecordCircle.setOnClickListener(v -> {
            if (activeRecording == null) startRecording();
            else stopRecording();
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_CAMERA && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            startCamera();
        } else {
            Toast.makeText(this, "Нужен доступ к камере для записи кружочка", Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(this);
        future.addListener(() -> {
            try {
                ProcessCameraProvider provider = future.get();
                Recorder recorder = new Recorder.Builder()
                        .setQualitySelector(QualitySelector.from(Quality.SD))
                        .build();
                videoCapture = VideoCapture.withOutput(recorder);

                provider.unbindAll();
                provider.bindToLifecycle(this, CameraSelector.DEFAULT_FRONT_CAMERA,
                        videoCapture, b.previewCircle.getPreviewUseCase());
            } catch (ExecutionException | InterruptedException e) {
                Toast.makeText(this, "Ошибка камеры: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void startRecording() {
        File outFile = new File(getExternalCacheDir(), "circle_" + System.currentTimeMillis() + ".mp4");
        FileOutputOptions outputOptions = new FileOutputOptions.Builder(outFile).build();

        activeRecording = videoCapture.getOutput()
                .prepareRecording(this, outputOptions)
                .withAudioEnabled()
                .start(ContextCompat.getMainExecutor(this), (Consumer<VideoRecordEvent>) event -> {
                    if (event instanceof VideoRecordEvent.Finalize finalize) {
                        if (!finalize.hasError()) {
                            uploadCircle(Uri.fromFile(outFile), (int) (System.currentTimeMillis() - recordStart));
                        } else {
                            Toast.makeText(this, "Ошибка записи: " + finalize.getCause(), Toast.LENGTH_LONG).show();
                        }
                    }
                });

        recordStart = System.currentTimeMillis();
        b.btnRecordCircle.setText("Стоп");
        timerHandler.postDelayed(this::stopRecording, MAX_DURATION_MS);
    }

    private void stopRecording() {
        if (activeRecording != null) {
            activeRecording.stop();
            activeRecording = null;
            b.btnRecordCircle.setText("Запись");
        }
        timerHandler.removeCallbacksAndMessages(null);
    }

    private void uploadCircle(Uri fileUri, int durationMs) {
        String uid = FirebaseUtil.uid();
        String path = "circles/" + chatId + "/" + System.currentTimeMillis() + ".mp4";
        var ref = FirebaseUtil.storage().getReference().child(path);

        ref.putFile(fileUri)
                .continueWithTask(task -> ref.getDownloadUrl())
                .addOnSuccessListener(downloadUri -> {
                    ChatMessage msg = ChatMessage.circle(uid, downloadUri.toString(),
                            durationMs, System.currentTimeMillis());
                    FirebaseUtil.firestore()
                            .collection("chats").document(chatId)
                            .collection("messages").add(msg)
                            .addOnSuccessListener(d -> finish());
                })
                .addOnFailureListener(e -> Toast.makeText(this, "Ошибка загрузки: " + e.getMessage(), Toast.LENGTH_LONG).show());
    }
}
