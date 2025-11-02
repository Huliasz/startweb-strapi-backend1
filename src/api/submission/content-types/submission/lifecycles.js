// src/api/submission/content-types/submission/lifecycles.js
module.exports = {
  async afterCreate(event) {
    console.log(
      "--- afterCreate lifecycle hook triggered (Attempting SendGrid) ---"
    );
    const { result } = event;

    // Pobieramy adresata (Ciebie) i nadawcę (Twój adres SendGrid) ze zmiennych środowiskowych
    const recipientEmail =
      process.env.RECIPIENT_EMAIL || "kontakt@startweb.com.pl";
    const senderEmail = process.env.SENDGRID_DEFAULT_FROM; // MUSI być ustawione w Strapi Cloud

    // Sprawdzenie krytyczne: Czy mamy nadawcę?
    if (!senderEmail) {
      console.error(
        "--- ERROR: Zmienna środowiskowa SENDGRID_DEFAULT_FROM nie jest ustawiona! Nie można wysłać e-maila. ---"
      );
      return; // Przerwij funkcję, jeśli brakuje nadawcy
    }

    try {
      // --- E-mail do Ciebie (Powiadomienie) ---
      console.log(`Attempting to send email to owner (${recipientEmail})...`);
      await strapi.plugins["email"].services.email.send({
        to: recipientEmail,
        from: senderEmail, // WAŻNE: Przywrócone dla SendGrid
        replyTo: result.email,
        subject: `Nowe zapytanie z formularza: ${result.name} (${result.email})`,
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
      console.log("Email to owner potentially sent.");

      // --- E-mail do Klienta (Potwierdzenie) ---
      console.log(
        `Attempting to send confirmation email to client (${result.email})...`
      );
      await strapi.plugins["email"].services.email.send({
        to: result.email, // Adres klienta
        from: senderEmail, // WAŻNE: Przywrócone dla SendGrid
        replyTo: recipientEmail, // Ustaw 'replyTo' na swój adres
        subject: "Potwierdzenie otrzymania zapytania - StartWeb",
        html: `
                    <p>Witaj ${result.name},</p>
                    <p>Dziękujemy za Twoje zapytanie! Otrzymaliśmy Twoją wiadomość i wkrótce się z Tobą skontaktujemy (zazwyczaj w ciągu 24 godzin).</p>
                    <p>Pozdrawiamy serdecznie,</p>
                    <p>Zespół StartWeb</p>
                `,
      });
      console.log("Confirmation email to client potentially sent.");
    } catch (err) {
      console.error("--- ERROR SENDING EMAIL (SendGrid) ---");
      console.error("Error Details:", err);
      if (err.response) {
        console.error("SendGrid Response Body:", err.response.body);
      }
    }
  },
};
