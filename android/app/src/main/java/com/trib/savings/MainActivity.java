package com.trib.savings;

import android.Manifest;
import android.os.Build;
import android.os.Bundle;
import androidx.annotation.NonNull;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LedgerPlugin.class);
        super.onCreate(savedInstanceState);
        String[] perms = Build.VERSION.SDK_INT >= 33
            ? new String[] { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS, Manifest.permission.POST_NOTIFICATIONS }
            : new String[] { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS };
        requestPermissions(perms, 1);
    }

    /** Once SMS access is granted, tell the UI to reload so the inbox history shows up straight away. */
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (getBridge() != null) getBridge().triggerWindowJSEvent("savingsrefresh");
    }
}
