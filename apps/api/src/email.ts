export type Email = { to: string; subject: string; text: string; link?: string };

/** Sends outgoing email. Locally it prints to the console; tests use a recording fake. */
export interface EmailSender {
  send(email: Email): Promise<void>;
}

export const consoleEmailSender: EmailSender = {
  async send({ to, subject, text, link }) {
    console.log(`\n✉️  To: ${to}\n   Subject: ${subject}\n   ${text}${link ? `\n   Link: ${link}` : ""}\n`);
  },
};
