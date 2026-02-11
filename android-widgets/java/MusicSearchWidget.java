package app.lovable.universflow.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import com.getcapacitor.BridgeActivity;

/**
 * iOS-style search bar widget - tapping opens the app's search page
 */
public class MusicSearchWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_music_search);
        
        // Tapping search bar opens search
        Intent searchIntent = new Intent(context, BridgeActivity.class);
        searchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        searchIntent.setData(Uri.parse("universflow://search"));
        PendingIntent searchPendingIntent = PendingIntent.getActivity(context, 300, 
            searchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_search_bar, searchPendingIntent);
        views.setOnClickPendingIntent(R.id.widget_search_icon, searchPendingIntent);
        views.setOnClickPendingIntent(R.id.widget_search_text, searchPendingIntent);
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
