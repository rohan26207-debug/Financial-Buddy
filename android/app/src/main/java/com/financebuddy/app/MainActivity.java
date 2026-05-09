package com.financebuddy.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Finance Buddy - 100% offline WebView wrapper.
 * Loads the bundled React app from file:///android_asset/index.html.
 * No internet permission is required: all data is stored in WebView's
 * localStorage on the device.
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Translucent status bar that matches the teal theme
        getWindow().setStatusBarColor(getResources().getColor(R.color.teal_700, getTheme()));

        webView = findViewById(R.id.webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);          // localStorage support
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(0xFFFFFFFF);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                android.util.Log.d("FinanceBuddy",
                    cm.message() + " -- @" + cm.lineNumber() + " (" + cm.sourceId() + ")");
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    /**
     * Mobile-app-style back navigation:
     *   - If the user is on the home tab (Investments) -> exit the app.
     *   - Otherwise -> jump to Investments and clear the WebView history
     *     so the next back press exits cleanly (no in-app history walking).
     */
    private void goHomeOrExitApp() {
        if (webView == null) {
            finish();
            return;
        }
        String url = webView.getUrl();
        boolean atHome = url == null
                || !url.contains("#")
                || url.endsWith("#/")
                || url.endsWith("#/investments");

        if (atHome) {
            finish();
            return;
        }

        webView.evaluateJavascript(
                "window.location.hash = '#/investments';", null);
        // Clear back/forward history once the SPA has navigated, so a
        // subsequent back press exits the app instead of cycling tabs.
        webView.postDelayed(() -> {
            if (webView != null) webView.clearHistory();
        }, 250);
    }

    @Override
    public void onBackPressed() {
        goHomeOrExitApp();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            goHomeOrExitApp();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
