
interface SendDailyUpdateParams {
  to: string;
  inTime: string;
  outTime: string;
  tasks: string;
  date: string;
}

export async function sendDailyUpdate({
  inTime,
  outTime,
  tasks,
  date,
}: SendDailyUpdateParams) {
  const token = process.env.ZOHO_OAUTH_TOKEN;
  const accountId = process.env.ZOHO_MAIL_ACCOUNT_ID;
  const from = process.env.ZOHO_MAIL_FROM;
  const to = process.env.ZOHO_MAIL_TO;

  if (!token || !accountId || !from) {
    throw new Error("Missing Zoho Mail environment variables");
  }

  const subject = `Daily Update - Himanshu Sheetlani - ${date}`;

  const content = 
    `<div>
      <p>Hello sir,</p>

      <p>
        <strong>In Time:</strong> ${inTime}<br/>
        <strong>Out Time:</strong> ${outTime}
      </p>

      <p>Please find my updates for today below:</p>

      <ul>
        ${tasks}
      </ul>

      <p>Please let me know if any additional details are required.</p>

      <p>
        Thanks & Regards,<br/>
        Himanshu Sheetlani<br/>
        Graduate Engineer Trainee<br/>
        Service Engineering
      </p>
    </div>`;
  const response = await fetch(
    `https://mail.zoho.in/api/accounts/${accountId}/messages`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Zoho-oauthtoken ${token}`,
      },
      body: JSON.stringify({
        fromAddress: from,
        toAddress: to,
        subject,
        content,
        askReceipt: "no",
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Zoho Mail API error: ${JSON.stringify(result)}`);
  }

  return result;
}
