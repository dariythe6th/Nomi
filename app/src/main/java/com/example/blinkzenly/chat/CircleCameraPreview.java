package com.example.blinkzenly.chat;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Path;
import android.util.AttributeSet;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.camera.core.Preview;
import androidx.camera.view.PreviewView;

/**
 * Круглый превью-видоискатель для записи "кружочков" (п.6).
 * Оборачивает PreviewView (composition), обрезая её по кругу через canvas.clipPath.
 *
 * ВАЖНО: PreviewView — final-класс, от него нельзя наследоваться.
 * Поэтому используем FrameLayout-обёртку.
 */
public class CircleCameraPreview extends FrameLayout {

    private final PreviewView previewView;
    private final Path clipPath = new Path();

    public CircleCameraPreview(@NonNull Context context) {
        this(context, null);
    }

    public CircleCameraPreview(@NonNull Context context, @Nullable AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CircleCameraPreview(@NonNull Context context,
                               @Nullable AttributeSet attrs,
                               int defStyleAttr) {
        super(context, attrs, defStyleAttr);

        previewView = new PreviewView(context);
        addView(previewView, new LayoutParams(
                LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

        setWillNotDraw(false);
    }

    public PreviewView getPreviewView() {
        return previewView;
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        clipPath.reset();
        float radius = Math.min(w, h) / 2f;
        clipPath.addCircle(w / 2f, h / 2f, radius, Path.Direction.CW);
    }

    @Override
    protected void dispatchDraw(Canvas canvas) {
        int save = canvas.save();
        canvas.clipPath(clipPath);
        super.dispatchDraw(canvas);
        canvas.restoreToCount(save);
    }

    public Preview getPreviewUseCase() {
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());
        return preview;
    }
}