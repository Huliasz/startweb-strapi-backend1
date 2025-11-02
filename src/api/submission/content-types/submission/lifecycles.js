// src/api/submission/content-types/submission/lifecycles.js

// Używamy Set do śledzenia ID zgłoszeń, które są AKTUALNIE przetwarzane.
// Zapobiega to podwójnemu wysyłaniu e-maili, jeśli hook jest ładowany/wywoływany podwójnie.
const processedSubmissionIds = new Set();

module.exports = {
  async afterCreate(event) {
    const { result } = event; // Dane zapisanego zgłoszenia

    // --- POCZĄTEK ZABEZPIECZENIA PRZED PODWÓJNYM URUCHOMIENIEM ---
    if (processedSubmissionIds.has(result.id)) {
      // Jeśli ID jest już przetwarzane (przez drugie, zduplikowane wywołanie), przerwij.
      console.warn(
        `[LIFECYCLE] Zduplikowane wywołanie afterCreate dla ID: ${result.id}. Pomijanie wysyłki e-mail.`
      );
      return; // Zakończ, aby nie wysyłać ponownie
    }
    // Natychmiast dodaj ID do Set, aby zablokować kolejne wywołania dla tego ID
    processedSubmissionIds.add(result.id);
    // --- KONIEC ZABEZPIECZENIA ---

    console.log(
      `--- afterCreate hook triggered (ID: ${result.id}) (Attempting SendGrid) ---`
    );

    const recipientEmail =
      process.env.RECIPIENT_EMAIL || "kontakt@startweb.com.pl";
    const senderEmail = process.env.SENDGRID_DEFAULT_FROM;

    if (!senderEmail) {
      console.error(
        "--- ERROR: Zmienna środowiskowa SENDGRID_DEFAULT_FROM nie jest ustawiona! Nie można wysłać e-maila. ---"
      );
      processedSubmissionIds.delete(result.id); // Usuń blokadę, bo wystąpił błąd konfiguracji
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
      // Jeśli wystąpił błąd, usuwamy ID z Set, aby umożliwić ewentualną ponowną próbę
      processedSubmissionIds.delete(result.id);
      if (err.response) {
        console.error("SendGrid Response Body:", err.response.body);
      }
    } finally {
      // Czyścimy blokadę po 10 sekundach.
      // Opóźnienie jest na wypadek, gdyby zduplikowane wywołania nie nastąpiły natychmiast.
      setTimeout(() => {
        processedSubmissionIds.delete(result.id);
        console.log(`[LIFECYCLE] Usunięto blokadę dla ID: ${result.id}`);
      }, 10000); // 10 sekund
    }
  },
};
