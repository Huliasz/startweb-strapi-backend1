// src/api/submission/content-types/submission/lifecycles.js

// src/api/submission/content-types/submission/lifecycles.js
console.log("--- Loading lifecycles.js for Submission ---"); // Log during server start

module.exports = {
  async afterCreate(event) {
    // Log informujący, że hook został uruchomiony
    console.log("--- afterCreate lifecycle hook triggered ---");

    const { result } = event; // Dane zapisanego zgłoszenia
    console.log("Submission data:", result); // Loguj dane

    // Używaj zmiennych środowiskowych do adresów, fallback jeśli nie ma
    const recipientEmail =
      process.env.RECIPIENT_EMAIL || "kontakt@startweb.com.pl"; // Twój email
    const senderEmail =
      process.env.SENDGRID_DEFAULT_FROM || "kontakt@startweb.com.pl"; // Nadawca (z .env)

    try {
      // --- E-mail do Ciebie ---
      console.log(`Attempting to send email to owner (${recipientEmail})...`);
      await strapi.plugins["email"].services.email.send({
        to: recipientEmail,
        from: senderEmail, // Nadawca z konfiguracji
        replyTo: result.email, // Odpowiedź pójdzie do klienta
        subject: `Nowe zapytanie z formularza: ${result.name}`,
        html: `
                    <h2>Otrzymano nowe zgłoszenie:</h2>
                    <p><strong>Imię:</strong> ${result.name}</p>
                    <p><strong>Email:</strong> ${result.email}</p>
                    <p><strong>Telefon:</strong> ${result.phone || "Nie podano"}</p>
                    <hr>
                    <p><strong>Wiadomość:</strong></p>
                    <p>${result.message ? result.message.replace(/\n/g, "<br>") : "Brak wiadomości"}</p> 
                `,
      });
      console.log("Email to owner seemingly sent.");

      // --- E-mail do Klienta ---
      console.log(
        `Attempting to send confirmation email to client (${result.email})...`
      );
      await strapi.plugins["email"].services.email.send({
        to: result.email, // Adres klienta
        from: senderEmail, // Nadawca z konfiguracji
        subject: "Potwierdzenie otrzymania zapytania - StartWeb",
        html: `
                    <p>Witaj ${result.name},</p>
                    <p>Dziękujemy za Twoje zapytanie! Otrzymaliśmy Twoją wiadomość i wkrótce się z Tobą skontaktujemy (zazwyczaj w ciągu 24 godzin).</p>
                    <p>Pozdrawiamy serdecznie,</p>
                    <p>Zespół StartWeb</p>
                `,
      });
      console.log("Confirmation email to client seemingly sent.");

      console.log(
        `Emails potentially sent successfully for submission ID: ${result.id}`
      );
    } catch (err) {
      // Szczegółowe logowanie błędu
      console.error("--- ERROR SENDING EMAIL in afterCreate ---");
      console.error("Error Details:", err);
      if (err.response) {
        console.error("SendGrid Response Body:", err.response.body);
      }
    }
  },
};
