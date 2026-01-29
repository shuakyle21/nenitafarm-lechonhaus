import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING;

const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString,
    enableAutoRouteTracking: true,
  },
});

export const initializeAppInsights = () => {
  try {
    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Manually track the first page view
    console.log('Application Insights initialized');
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
  }
};

export { appInsights };
