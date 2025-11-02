// src/api/submission/content-types/submission/lifecycles.js
module.exports = {
  async afterCreate(event) {
    console.log(
      "--- afterCreate lifecycle hook triggered (Using SendGrid Config) ---"
    );
    const { result } = event;

    const recipientEmail =
      process.env.RECIPIENT_EMAIL || "kontakt@startweb.com.pl";
    // Pobieramy nadawcę ZE ZMIENNEJ ŚRODOWISKOWEJ (ważne dla SendGrid)
    const senderEmail =
      process.env.SENDGRID_DEFAULT_FROM || "kontakt@startweb.com.pl";

    try {
      // --- E-mail do Ciebie ---
      console.log(`Attempting to send email to owner (${recipientEmail})...`);
      await strapi.plugins["email"].services.email.send({
        to: recipientEmail,
        from: senderEmail, // WAŻNE: Musi być (i musi być zweryfikowane w SendGrid)
        replyTo: result.email,
        subject: `Nowe zapytanie z formularza: ${result.name} (${result.email})`,
        html: `... (Twoja treść HTML) ...`,
      });
      console.log("Email to owner sent via SendGrid.");

      // --- E-mail do Klienta ---
      console.log(
        `Attempting to send confirmation email to client (${result.email})...`
      );
      await strapi.plugins["email"].services.email.send({
        to: result.email,
        from: senderEmail, // WAŻNE: Musi być
        replyTo: recipientEmail,
        subject: "Potwierdzenie otrzymania zapytania - StartWeb",
        html: `... (Twoja treść HTML dla klienta) ...`,
      });
      console.log("Confirmation email to client sent via SendGrid.");
    } catch (err) {
      console.error("--- ERROR SENDING EMAIL (SendGrid) ---");
      console.error("Error Details:", err);
      if (err.response) {
        console.error("SendGrid Response Body:", err.response.body);
      }
    }
  },
};
