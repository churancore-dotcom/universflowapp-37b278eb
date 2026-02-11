package app.lovable.universflow.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import com.getcapacitor.BridgeActivity;

public class QuickActionsWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_actions);
        
        // Open App
        views.setOnClickPendingIntent(R.id.widget_open_app, 
            createDeepLinkIntent(context, "universflow://home", 0));
        
        // Search
        views.setOnClickPendingIntent(R.id.widget_search, 
            createDeepLinkIntent(context, "universflow://search", 1));
        
        // Shuffle All - launches app with action
        Intent shuffleIntent = new Intent(context, BridgeActivity.class);
        shuffleIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        shuffleIntent.setData(Uri.parse("universflow://widget-action?action=WIDGET_SHUFFLE_ALL"));
        shuffleIntent.putExtra("widget_action", "WIDGET_SHUFFLE_ALL");
        PendingIntent shufflePendingIntent = PendingIntent.getActivity(context, 2, 
            shuffleIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_shuffle_all, shufflePendingIntent);
        
        // Recent
        views.setOnClickPendingIntent(R.id.widget_recent, 
            createDeepLinkIntent(context, "universflow://home", 3));
        
        // Library
        views.setOnClickPendingIntent(R.id.widget_library, 
            createDeepLinkIntent(context, "universflow://library", 4));
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent createDeepLinkIntent(Context context, String uri, int requestCode) {
        Intent intent = new Intent(context, BridgeActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.setData(Uri.parse(uri));
        return PendingIntent.getActivity(context, requestCode, 
            intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
