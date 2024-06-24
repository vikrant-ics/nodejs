// Import the applicationinsights module
const appInsights = require('applicationinsights');

// Load environment variables from a .env file if available
require('dotenv').config();

// Initialize the Application Insights with your Instrumentation Key or Connection String
appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoDependencyCorrelation(true)
    .start();

// Get the default client
const client = appInsights.defaultClient;

// Example function to log custom events and metrics
function logCustomEvent() {
    client.trackEvent({ name: "customEvent", properties: { customProperty: "customValue" } });
}

function logCustomMetric() {
    client.trackMetric({ name: "customMetric", value: 100 });
}

function logTraceMessage() {
    client.trackTrace({ message: "This is a trace message" });
}

function logException() {
    try {
        throw new Error("This is a test exception");
    } catch (error) {
        client.trackException({ exception: error });
    }
}

function logConsoleMessage(message) {
    console.log(message); // Output to console

    // Send console log message to Application Insights as a custom event
    client.trackEvent({ name: "ConsoleLog", properties: { message: message } });
}

// Call the functions to log data
logCustomEvent();
logCustomMetric();
logTraceMessage();
logException();

logCustomEvent("=============Test message=============");
logConsoleMessage("=Test console log message from container=");

// Example of logging a request (usually done automatically)
const http = require('http');
http.createServer((req, res) => {
    client.trackRequest({ name: "GET /", url: req.url, duration: 100, resultCode: 200, success: true });
    res.end('Hello World');
}).listen(3002);

console.log('Server running at http://localhost:3002/');
console.log('=============This is the test log dump============================');