package com.PACTOGRAM.myapp;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Wait for the bridge to be created, then modify WebView settings
        // Note: Bridge might not be fully initialized in onCreate before super, 
        // so we do this after super.onCreate, but Capacitor initializes it.
        // Actually, a safer way in Capacitor 3+ is to override onResume or just use the plugin.
        // Let's safely try to get the WebView. If null, we might need to do it later, but Capacitor 
        // usually has it ready after super.onCreate.
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
