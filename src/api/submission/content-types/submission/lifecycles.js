// src/api/submission/content-types/submission/lifecycles.js

// Używamy Set do śledzenia UNIKALNYCH KLUCZY ZGŁOSZEŃ (e-mail + wiadomość)
// Zapobiega to podwójnemu wysyłaniu e-maili, nawet jeśli Strapi utworzy dwa wpisy w bazie.
const processingSubmissions = new Set();

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Tworzymy unikalny klucz na podstawie treści, a nie ID
    const uniqueKey = `${result.email || ""}::${result.message || ""}`;

    // --- ZABEZPIECZENIE PRZED DUPLIKATAMI TREŚCI ---
    if (processingSubmissions.has(uniqueKey)) {
      console.warn(
        `[LIFECYCLE] Wykryto zduplikowane zgłoszenie (Klucz: ${uniqueKey}, ID: ${result.id}). Pomijanie wysyłki e-mail.`
      );
      return; // Zakończ, aby nie wysyłać ponownie
    }
    // Natychmiast dodaj klucz, aby zablokować kolejne wywołania
    processingSubmissions.add(uniqueKey);
    // --- KONIEC ZABEZPIECZENIA ---

    console.log(
      `--- afterCreate hook triggered (ID: ${result.id}, Klucz: ${uniqueKey}) (Attempting SendGrid) ---`
    );

    const recipientEmail =
      process.env.RECIPIENT_EMAIL || "kontakt@startweb.com.pl";
    const senderEmail = process.env.SENDGRID_DEFAULT_FROM;

    if (!senderEmail) {
      console.error(
        "--- ERROR: Zmienna środowiskowa SENDGRID_DEFAULT_FROM nie jest ustawiona! ---"
      );
      processingSubmissions.delete(uniqueKey); // Usuń blokadę
      return;
    }

    try {
      // --- E-mail do Ciebie (Powiadomienie) ---
      console.log(`Attempting to send email to owner (${recipientEmail})...`);
      await strapi.plugins["email"].services.email.send({
        to: recipientEmail,
        from: senderEmail,
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
      console.log("Email to owner sent.");

      // --- E-mail do Klienta (Potwierdzenie) ---
      console.log(
        `Attempting to send confirmation email to client (${result.email})...`
      );
      await strapi.plugins["email"].services.email.send({
        to: result.email,
        from: senderEmail,
        replyTo: recipientEmail,
        subject: "Potwierdzenie otrzymania zapytania - StartWeb",
        html: `
                    <p>Witaj ${result.name},</p>
                    <p>Dziękujemy za Twoje zapytanie! Wiadomość został otrzymna i wkrótce się z Tobą skontaktujemy (zazwyczaj w ciągu 24 godzin).</p>
                    <p>Pozdrawiamy serdecznie,</p>
                    <p>Zespół StartWeb</p>
                `,
      });
      console.log("Confirmation email to client sent.");
    } catch (err) {
      console.error("--- ERROR SENDING EMAIL (SendGrid) ---");
      console.error("Error Details:", err);
      if (err.response) {
        console.error("SendGrid Response Body:", err.response.body);
      }
    } finally {
      // Czyścimy blokadę po 10 sekundach.
      // To daje czas drugiemu (zduplikowanemu) wywołaniu hooka na bycie przechwyconym przez blokadę.
      setTimeout(() => {
        processingSubmissions.delete(uniqueKey);
        console.log(`[LIFECYCLE] Usunięto blokadę dla Klucza: ${uniqueKey}`);
      }, 10000); // 10 sekund
    }
  },
};
