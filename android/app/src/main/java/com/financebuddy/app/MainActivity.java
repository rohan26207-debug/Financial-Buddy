package com.financebuddy.app;

import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;

/**
 * Finance Buddy - 100% offline WebView wrapper.
 * Loads the bundled React app from file:///android_asset/index.html.
 *
 * Exposes a JavaScript bridge `window.FinanceBuddyAndroid` so the web UI
 * can save PDF / JSON files directly into the system Downloads folder
 * (and open the PDF in any installed PDF viewer / share sheet). This is
 * the same pattern used by the petrol-pump app referenced by the user.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "FinanceBuddy";
    private static final int SELECT_JSON_FILE_REQUEST = 102;
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
                Log.d(TAG, cm.message() + " -- @" + cm.lineNumber() + " (" + cm.sourceId() + ")");
                return true;
            }
        });

        // JS bridge for native PDF / backup handling.
        webView.addJavascriptInterface(new FinanceBuddyBridge(this), "FinanceBuddyAndroid");

        webView.loadUrl("file:///android_asset/index.html");
    }

    /**
     * Mobile-app-style back navigation:
     *   - On the home tab (Investments) -> do NOTHING. The user must
     *     swipe up / use the system gesture to exit. This prevents
     *     accidental exits from the back button.
     *   - On any other screen -> jump to Investments and clear the
     *     WebView history.
     */
    private void goHomeOrExitApp() {
        if (webView == null) return;
        String url = webView.getUrl();
        boolean atHome = url == null
                || !url.contains("#")
                || url.endsWith("#/")
                || url.endsWith("#/investments");

        if (atHome) {
            // Intentionally swallow the back press at home.
            return;
        }

        webView.evaluateJavascript(
                "window.location.hash = '#/investments';", null);
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

    // -------------- File picker for JSON import --------------

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SELECT_JSON_FILE_REQUEST && resultCode == RESULT_OK
                && data != null && data.getData() != null) {
            readJsonFile(data.getData());
        }
    }

    private void readJsonFile(Uri uri) {
        try (java.io.InputStream is = getContentResolver().openInputStream(uri)) {
            if (is == null) return;
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = is.read(buf)) != -1) out.write(buf, 0, n);
            final String json = out.toString("UTF-8");
            runOnUiThread(() -> {
                String escaped = json
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                        .replace("\t", "\\t");
                String js = "if (typeof window.handleAndroidImport === 'function') {"
                        + " window.handleAndroidImport(\"" + escaped + "\"); }";
                webView.evaluateJavascript(js, null);
            });
        } catch (Exception e) {
            Log.e(TAG, "Failed to read picked JSON", e);
        }
    }

    // -------------- JavaScript bridge --------------

    public class FinanceBuddyBridge {
        final Context context;

        FinanceBuddyBridge(Context c) { context = c; }

        @JavascriptInterface
        public boolean isAvailable() { return true; }

        /**
         * Save a base64-encoded PDF into the system Downloads folder and
         * open it with the user's preferred PDF viewer (which on Android
         * usually exposes a Share action of its own).
         */
        @JavascriptInterface
        public void openPdfWithViewer(String base64Pdf, String fileName) {
            try {
                byte[] bytes = Base64.decode(base64Pdf, Base64.DEFAULT);
                Uri uri = saveToDownloads(fileName, "application/pdf", bytes);
                if (uri != null) {
                    runOnUiThread(() -> openWithViewer(uri, "application/pdf"));
                }
            } catch (Exception e) {
                Log.e(TAG, "openPdfWithViewer failed", e);
                runOnUiThread(() -> Toast.makeText(context,
                        "Failed to save PDF: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }

        /**
         * Save plain JSON text to Downloads. Used by the Share/Backup
         * button when running inside the Android wrapper.
         */
        @JavascriptInterface
        public void saveJsonBackup(String jsonData, String fileName) {
            try {
                Uri uri = saveToDownloads(fileName, "application/json",
                        jsonData.getBytes("UTF-8"));
                if (uri != null) {
                    runOnUiThread(() -> Toast.makeText(context,
                            "Backup saved to Downloads: " + fileName,
                            Toast.LENGTH_LONG).show());
                }
            } catch (Exception e) {
                Log.e(TAG, "saveJsonBackup failed", e);
                runOnUiThread(() -> Toast.makeText(context,
                        "Failed to save backup: " + e.getMessage(),
                        Toast.LENGTH_LONG).show());
            }
        }

        /**
         * Open the system file picker so the user can pick a JSON backup
         * to import. The chosen file is read and forwarded to JavaScript
         * via window.handleAndroidImport(jsonString).
         */
        @JavascriptInterface
        public void selectJsonBackup() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                // Accept JSON and PDF (PDF files now carry an embedded JSON backup
                // that the React app can extract via Backup -> Import from PDF).
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES,
                        new String[]{"application/json", "application/pdf", "text/plain"});
                try {
                    MainActivity.this.startActivityForResult(
                            intent, SELECT_JSON_FILE_REQUEST);
                } catch (Exception e) {
                    Log.e(TAG, "selectJsonBackup failed", e);
                }
            });
        }

        /**
         * Fire a system Share intent that attaches both the PDF report and
         * the JSON backup so the user can pick Email, WhatsApp, Drive,
         * Bluetooth, etc. from the share sheet.
         *
         * Either argument may be null/empty to share only the other one.
         */
        @JavascriptInterface
        public void shareBackup(String pdfBase64, String pdfFileName,
                                String jsonData, String jsonFileName) {
            runOnUiThread(() -> {
                try {
                    ArrayList<Uri> uris = new ArrayList<>();
                    if (pdfBase64 != null && pdfBase64.length() > 0) {
                        byte[] pdfBytes = Base64.decode(pdfBase64, Base64.DEFAULT);
                        Uri u = writeToCacheAndUri(
                                pdfFileName != null ? pdfFileName : "finance-buddy-report.pdf",
                                pdfBytes);
                        if (u != null) uris.add(u);
                    }
                    if (jsonData != null && jsonData.length() > 0) {
                        Uri u = writeToCacheAndUri(
                                jsonFileName != null ? jsonFileName : "finance-buddy-backup.json",
                                jsonData.getBytes("UTF-8"));
                        if (u != null) uris.add(u);
                    }
                    if (uris.isEmpty()) {
                        Toast.makeText(context, "Nothing to share", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    Intent intent;
                    if (uris.size() == 1) {
                        intent = new Intent(Intent.ACTION_SEND);
                        intent.putExtra(Intent.EXTRA_STREAM, uris.get(0));
                        intent.setType(uris.get(0).toString().endsWith(".pdf")
                                ? "application/pdf" : "application/json");
                    } else {
                        intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
                        intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
                        intent.setType("*/*");
                    }
                    intent.putExtra(Intent.EXTRA_SUBJECT, "Finance Buddy backup");
                    intent.putExtra(Intent.EXTRA_TEXT,
                            "Finance Buddy data backup and report.");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(intent, "Share backup"));
                } catch (Exception e) {
                    Log.e(TAG, "shareBackup failed", e);
                    Toast.makeText(context,
                            "Could not share: " + e.getMessage(),
                            Toast.LENGTH_LONG).show();
                }
            });
        }

        /**
         * Open the user's email app with the JSON backup (and optionally
         * the PDF) pre-attached. Falls back to a generic share sheet if
         * no email client handles ACTION_SENDTO with mailto:.
         */
        @JavascriptInterface
        public void emailBackup(String jsonData, String jsonFileName,
                                String pdfBase64, String pdfFileName,
                                String toAddress) {
            runOnUiThread(() -> {
                try {
                    ArrayList<Uri> uris = new ArrayList<>();
                    if (jsonData != null && jsonData.length() > 0) {
                        Uri u = writeToCacheAndUri(
                                jsonFileName != null ? jsonFileName : "finance-buddy-backup.json",
                                jsonData.getBytes("UTF-8"));
                        if (u != null) uris.add(u);
                    }
                    if (pdfBase64 != null && pdfBase64.length() > 0) {
                        byte[] pdfBytes = Base64.decode(pdfBase64, Base64.DEFAULT);
                        Uri u = writeToCacheAndUri(
                                pdfFileName != null ? pdfFileName : "finance-buddy-report.pdf",
                                pdfBytes);
                        if (u != null) uris.add(u);
                    }
                    Intent intent;
                    if (uris.size() <= 1) {
                        intent = new Intent(Intent.ACTION_SEND);
                        if (uris.size() == 1) {
                            intent.putExtra(Intent.EXTRA_STREAM, uris.get(0));
                        }
                    } else {
                        intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
                        intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
                    }
                    intent.setType("application/json");
                    if (toAddress != null && toAddress.length() > 0) {
                        intent.putExtra(Intent.EXTRA_EMAIL, new String[]{toAddress});
                    }
                    intent.putExtra(Intent.EXTRA_SUBJECT, "Finance Buddy backup");
                    intent.putExtra(Intent.EXTRA_TEXT,
                            "Attached is your Finance Buddy backup.");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    // Prefer an email-only chooser if any email app is installed.
                    Intent chooser = Intent.createChooser(intent, "Email backup");
                    startActivity(chooser);
                } catch (Exception e) {
                    Log.e(TAG, "emailBackup failed", e);
                    Toast.makeText(context,
                            "Could not start email: " + e.getMessage(),
                            Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    /**
     * Write `bytes` into the app's cache directory and return a content://
     * Uri for it via FileProvider, suitable for ACTION_SEND attachments.
     */
    private Uri writeToCacheAndUri(String fileName, byte[] bytes) {
        try {
            File dir = new File(getCacheDir(), "share");
            if (!dir.exists() && !dir.mkdirs()) {
                Log.w(TAG, "mkdir failed for share cache");
            }
            File f = new File(dir, fileName);
            try (FileOutputStream fos = new FileOutputStream(f)) {
                fos.write(bytes);
                fos.flush();
            }
            return FileProvider.getUriForFile(this,
                    getApplicationContext().getPackageName() + ".fileprovider", f);
        } catch (IOException e) {
            Log.e(TAG, "writeToCacheAndUri failed", e);
            return null;
        }
    }

    private Uri saveToDownloads(String fileName, String mime, byte[] bytes) throws IOException {
        ContentResolver resolver = getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS);
        Uri uri = resolver.insert(MediaStore.Files.getContentUri("external"), values);
        if (uri == null) throw new IOException("Could not create Downloads entry");
        try (OutputStream os = resolver.openOutputStream(uri)) {
            if (os == null) throw new IOException("Output stream is null");
            os.write(bytes);
            os.flush();
        }
        return uri;
    }

    private void openWithViewer(Uri uri, String mime) {
        Intent view = new Intent(Intent.ACTION_VIEW);
        view.setDataAndType(uri, mime);
        view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_ACTIVITY_NO_HISTORY);
        try {
            startActivity(Intent.createChooser(view, "Open with"));
        } catch (Exception e) {
            Toast.makeText(this,
                    "No PDF viewer found. Saved to Downloads.",
                    Toast.LENGTH_LONG).show();
        }
    }
}
