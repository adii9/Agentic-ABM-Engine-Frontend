import { exec } from 'child_process';
import os from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const companies = body.companies || [];
    
    // Escape strings and assemble arguments
    const args = companies.map(c => `"${c.replace(/"/g, '\\"')}"`).join(' ');
    const command = `uv run kickoff ${args}`.trim();

    const targetDir = path.join(os.homedir(), 'Crew AI Builds/Marketing/Antigravity/abm_engine');
    
    exec(command, { cwd: targetDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      if (stderr) console.error(`stderr: ${stderr}`);
    });

    return Response.json({ success: true, message: 'Kickoff initiated successfully.' });
  } catch (error) {
    console.error("Exec error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
