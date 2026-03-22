import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const getFilePath = () => path.join(os.homedir(), 'Crew AI Builds/Marketing/Antigravity/abm_engine/icp.yaml');

export async function GET(request) {
  try {
    const filePath = getFilePath();
    const yamlData = fs.readFileSync(filePath, 'utf-8');
    return Response.json({ success: true, data: yamlData });
  } catch (error) {
    console.error("Error reading icp.yaml:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { yamlData } = await request.json();
    if (!yamlData && yamlData !== '') {
      throw new Error("No payload provided.");
    }
    const filePath = getFilePath();
    fs.writeFileSync(filePath, yamlData, 'utf-8');
    return Response.json({ success: true, message: 'Saved successfully.' });
  } catch (error) {
    console.error("Error writing icp.yaml:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
