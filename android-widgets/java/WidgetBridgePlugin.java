package app.lovable.universflow.widgets;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.URL;
import java.io.InputStream;

/**
 * Capacitor plugin to bridge web app with native Android widgets.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateNowPlaying(PluginCall call) {
        String title = call.getString("title", "Not Playing");
        String artist = call.getString("artist", "");
        boolean isPlaying = call.getBoolean("isPlaying", false);
        int progress = call.getInt("progress", 0);
        String coverUrl = call.getString("coverUrl");
        
        Context context = getContext();
        NowPlayingWidget.updatePlaybackState(context, title, artist, isPlaying, progress, null);
        
        if (coverUrl != null && !coverUrl.isEmpty()) {
            loadAlbumArtAsync(context, coverUrl, title, artist, isPlaying, progress);
        }
        
        call.resolve();
    }
    
    @PluginMethod
    public void updateFavorites(PluginCall call) {
        String favoritesJson = call.getString("favorites", "[]");
        Context context = getContext();
        FavoritesWidget.updateFavorites(context, favoritesJson);
        call.resolve();
    }

    @PluginMethod
    public void updateRecentlyPlayed(PluginCall call) {
        String recentJson = call.getString("recent", "[]");
        Context context = getContext();
        RecentlyPlayedWidget.updateRecentlyPlayed(context, recentJson);
        call.resolve();
    }
    
    @PluginMethod
    public void refreshWidgets(PluginCall call) {
        Context context = getContext();
        
        Intent nowPlayingIntent = new Intent(context, NowPlayingWidget.class);
        nowPlayingIntent.setAction("android.appwidget.action.APPWIDGET_UPDATE");
        context.sendBroadcast(nowPlayingIntent);
        
        Intent favoritesIntent = new Intent(context, FavoritesWidget.class);
        favoritesIntent.setAction("android.appwidget.action.APPWIDGET_UPDATE");
        context.sendBroadcast(favoritesIntent);
        
        Intent quickActionsIntent = new Intent(context, QuickActionsWidget.class);
        quickActionsIntent.setAction("android.appwidget.action.APPWIDGET_UPDATE");
        context.sendBroadcast(quickActionsIntent);

        Intent recentIntent = new Intent(context, RecentlyPlayedWidget.class);
        recentIntent.setAction("android.appwidget.action.APPWIDGET_UPDATE");
        context.sendBroadcast(recentIntent);

        Intent searchIntent = new Intent(context, MusicSearchWidget.class);
        searchIntent.setAction("android.appwidget.action.APPWIDGET_UPDATE");
        context.sendBroadcast(searchIntent);
        
        call.resolve();
    }

    /**
     * Called when the app is launched from a widget action.
     * Checks the launching intent for widget actions and notifies JS.
     */
    @PluginMethod
    public void checkLaunchIntent(PluginCall call) {
        Intent intent = getActivity().getIntent();
        if (intent != null) {
            String widgetAction = intent.getStringExtra("widget_action");
            if (widgetAction != null) {
                JSObject result = new JSObject();
                result.put("action", widgetAction);
                String songId = intent.getStringExtra("song_id");
                if (songId != null) {
                    result.put("songId", songId);
                }
                // Clear the intent extra so it doesn't fire again
                intent.removeExtra("widget_action");
                call.resolve(result);
                return;
            }
        }
        JSObject result = new JSObject();
        result.put("action", "none");
        call.resolve(result);
    }
    
    private void loadAlbumArtAsync(Context context, String url, String title, 
            String artist, boolean isPlaying, int progress) {
        new Thread(() -> {
            try {
                URL imageUrl = new URL(url);
                InputStream inputStream = imageUrl.openStream();
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                inputStream.close();
                NowPlayingWidget.updatePlaybackState(context, title, artist, isPlaying, progress, bitmap);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
    
    @Override
    public void load() {
        super.load();
    }
}
