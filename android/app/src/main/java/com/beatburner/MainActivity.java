package com.beatburner;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.view.View;

import com.getcapacitor.Plugin;

import java.util.ArrayList;
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

//        hideSystemUI();

        /**
         * Initialize capacitor bridge
         */

    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }


    public void onDestroy(boolean hasFocus) {
        finish();
    }


    private void hideSystemUI() {
        final int flags = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        View decorView = getWindow().getDecorView();

        decorView.setSystemUiVisibility(flags);
        decorView.setOnSystemUiVisibilityChangeListener((int visibility) ->  {
            if((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                decorView.setSystemUiVisibility(flags);
            }
        });
    }
}
