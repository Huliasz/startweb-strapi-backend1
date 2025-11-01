// config/plugins.js

module.exports = ({ env }) => ({
  // ... other plugin configurations if you have any ...
  email: {
    config: {
      provider: "sendgrid", // Use the SendGrid provider
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"), // Your API key from the .env file
      },
      settings: {
        // Ensure this email is verified as a sender in SendGrid
        defaultFrom: env("SENDGRID_DEFAULT_FROM", "kontakt@startweb.com.pl"),
        // Email address replies should go to
        defaultReplyTo: env(
          "SENDGRID_DEFAULT_REPLY_TO",
          "kontakt@startweb.com.pl"
        ),
      },
    },
  },
});
