package app.lovable.universflow.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Recently Played widget - shows last 4 played songs in an iOS-style list
 */
public class RecentlyPlayedWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "UniversFlowWidgetPrefs";

    private static final int[] SONG_CONTAINERS = {
        R.id.widget_recent_1, R.id.widget_recent_2, 
        R.id.widget_recent_3, R.id.widget_recent_4
    };

    private static final int[] SONG_TITLES = {
        R.id.widget_recent_1_title, R.id.widget_recent_2_title,
        R.id.widget_recent_3_title, R.id.widget_recent_4_title
    };

    private static final int[] SONG_ARTISTS = {
        R.id.widget_recent_1_artist, R.id.widget_recent_2_artist,
        R.id.widget_recent_3_artist, R.id.widget_recent_4_artist
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_recently_played);
        
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String recentJson = prefs.getString("recently_played", "[]");
        
        try {
            JSONArray recent = new JSONArray(recentJson);
            
            for (int i = 0; i < 4; i++) {
                if (i < recent.length()) {
                    JSONObject song = recent.getJSONObject(i);
                    String songId = song.getString("id");
                    String title = song.getString("title");
                    String artist = song.getString("artist");
                    
                    views.setTextViewText(SONG_TITLES[i], title);
                    views.setTextViewText(SONG_ARTISTS[i], artist);
                    
                    Intent playIntent = new Intent(context, BridgeActivity.class);
                    playIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    playIntent.setData(Uri.parse("universflow://widget-action?action=WIDGET_PLAY_SONG&song_id=" + songId));
                    playIntent.putExtra("widget_action", "WIDGET_PLAY_SONG");
                    playIntent.putExtra("song_id", songId);
                    PendingIntent playPendingIntent = PendingIntent.getActivity(context, 200 + i, 
                        playIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    views.setOnClickPendingIntent(SONG_CONTAINERS[i], playPendingIntent);
                } else {
                    views.setTextViewText(SONG_TITLES[i], "—");
                    views.setTextViewText(SONG_ARTISTS[i], "");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Header tap opens app
        Intent openIntent = new Intent(context, BridgeActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openIntent.setData(Uri.parse("universflow://home"));
        PendingIntent openPendingIntent = PendingIntent.getActivity(context, 210, 
            openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_recent_header, openPendingIntent);
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateRecentlyPlayed(Context context, String recentJson) {
        SharedPreferences.Editor editor = context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit();
        editor.putString("recently_played", recentJson);
        editor.apply();
        
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, RecentlyPlayedWidget.class);
        int[] ids = manager.getAppWidgetIds(widget);
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
    }
}
