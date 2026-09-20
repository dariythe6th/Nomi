package com.example.blinkzenly.chat;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Path;
import android.net.Uri;
import android.util.AttributeSet;
import android.widget.MediaController;
import android.widget.VideoView;

/**
 * П.6 "Кружочки": VideoView, обрезанный по кругу через Path.clip —
 * визуально идентично круглым видео-сообщениям Telegram.
 */
public class CircleVideoView extends VideoView {

    private final Path clipPath = new Path();

    public CircleVideoView(Context context) { super(context); }
    public CircleVideoView(Context context, AttributeSet attrs) { super(context, attrs); }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        clipPath.reset();
        float radius = Math.min(w, h) / 2f;
        clipPath.addCircle(w / 2f, h / 2f, radius, Path.Direction.CW);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        int save = canvas.save();
        canvas.clipPath(clipPath);
        super.onDraw(canvas);
        canvas.restoreToCount(save);
    }

    public void playCircle(Uri uri) {
        setVideoURI(uri);
        setOnPreparedListener(mp -> {
            mp.setLooping(true);
            start();
        });
    }
}
