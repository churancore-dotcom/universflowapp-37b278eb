package app.lovable.universflow.widgets;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

/**
 * Lightweight service to keep widget updates active.
 * Widget updates are now handled directly via the WidgetBridgePlugin.
 */
public class WidgetUpdateService extends Service {

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }
}
