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

public class FavoritesWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "UniversFlowWidgetPrefs";

    private static final int[] FAV_CONTAINERS = {
        R.id.widget_fav_1, R.id.widget_fav_2, R.id.widget_fav_3,
        R.id.widget_fav_4, R.id.widget_fav_5, R.id.widget_fav_6
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_favorites);
        
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String favoritesJson = prefs.getString("favorites", "[]");
        
        try {
            JSONArray favorites = new JSONArray(favoritesJson);
            
            for (int i = 0; i < 5; i++) {
                if (i < favorites.length()) {
                    JSONObject song = favorites.getJSONObject(i);
                    String songId = song.getString("id");
                    
                    // Launch app with song play action
                    Intent playIntent = new Intent(context, BridgeActivity.class);
                    playIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    playIntent.setData(Uri.parse("universflow://widget-action?action=WIDGET_PLAY_SONG&song_id=" + songId));
                    playIntent.putExtra("widget_action", "WIDGET_PLAY_SONG");
                    playIntent.putExtra("song_id", songId);
                    PendingIntent playPendingIntent = PendingIntent.getActivity(context, 100 + i, 
                        playIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    views.setOnClickPendingIntent(FAV_CONTAINERS[i], playPendingIntent);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Shuffle favorites
        Intent shuffleIntent = new Intent(context, BridgeActivity.class);
        shuffleIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        shuffleIntent.setData(Uri.parse("universflow://widget-action?action=WIDGET_SHUFFLE_FAVORITES"));
        shuffleIntent.putExtra("widget_action", "WIDGET_SHUFFLE_FAVORITES");
        PendingIntent shufflePendingIntent = PendingIntent.getActivity(context, 110, 
            shuffleIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_shuffle_favorites, shufflePendingIntent);
        
        // See All opens library
        views.setOnClickPendingIntent(FAV_CONTAINERS[5], 
            createDeepLinkIntent(context, "universflow://library", 111));
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent createDeepLinkIntent(Context context, String uri, int requestCode) {
        Intent intent = new Intent(context, BridgeActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.setData(Uri.parse(uri));
        return PendingIntent.getActivity(context, requestCode, 
            intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    public static void updateFavorites(Context context, String favoritesJson) {
        SharedPreferences.Editor editor = context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit();
        editor.putString("favorites", favoritesJson);
        editor.apply();
        
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, FavoritesWidget.class);
        int[] ids = manager.getAppWidgetIds(widget);
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
    }
}
