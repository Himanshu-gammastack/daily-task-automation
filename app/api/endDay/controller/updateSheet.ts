
interface ZohoSheetRow {
  [key: string]: string | number | boolean;
}

interface UpdateWorksheetParams {
  headerRow?: number;
  data: ZohoSheetRow[];
}

export async function updateZohoWorksheet({
  data,
  headerRow = 4,
}: UpdateWorksheetParams) {
  const oauthToken = process.env.ZOHO_OAUTH_TOKEN;
  const resourceId = process.env.ZOHO_SHEET_RESOURCE_ID;
  const worksheetName = process.env.ZOHO_SHEET_SHEET_NAME as string;

  if (!oauthToken || !resourceId) {
    throw new Error("Zoho Sheet environment variables are missing");
  }

  const url = `https://sheet.zoho.in/api/v2/${resourceId}`;

  const body = new URLSearchParams({
    method: "worksheet.jsondata.set",
    worksheet_name: worksheetName,
    header_row: String(headerRow),
    json_data: JSON.stringify(data),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${oauthToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Zoho Sheet API error: ${JSON.stringify(result)}`
    );
  }

  return result;
}
