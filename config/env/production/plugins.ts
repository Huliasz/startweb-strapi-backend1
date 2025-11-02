// config/env/production/plugins.ts

export default ({ env }) => ({
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: env("SENDGRID_DEFAULT_FROM", "kontakt@startweb.com.pl"),
        defaultReplyTo: env(
          "SENDGRID_DEFAULT_REPLY_TO",
          "kontakt@startweb.com.pl"
        ),
      },
    },
  },
});
