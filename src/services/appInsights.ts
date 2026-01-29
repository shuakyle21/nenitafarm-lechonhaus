import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = 'InstrumentationKey=8a01c1c8-34e7-42a9-88a1-0fa052b5c22c;IngestionEndpoint=https://eastus2-3.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus2.livediagnostics.monitor.azure.com/;ApplicationId=6f012df7-1503-4e76-9d23-7ef5b9366e3f';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString,
    enableAutoRouteTracking: true, // Also enabling auto route tracking for better insights
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
