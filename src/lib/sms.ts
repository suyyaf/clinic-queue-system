export interface SmsPayload {
  to: string;
  message: string;
}

export async function sendSms({ to, message }: SmsPayload): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.log(`[SMS MOCK] To: ${to}\nMessage: ${message}\n`);
    return true;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({ From: from, To: to, Body: message });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    return res.ok;
  } catch {
    console.error("[SMS] Failed to send SMS");
    return false;
  }
}

export function buildQueueMessage(
  patientName: string,
  queueNumber: number,
  type: "called" | "reminder"
) {
  if (type === "called") {
    return `Hello ${patientName}, Queue #${String(queueNumber).padStart(3, "0")} is now being called. Please proceed to the consultation room.`;
  }
  return `Reminder: ${patientName}, your queue #${String(queueNumber).padStart(3, "0")} will be called soon. Please be ready.`;
}
