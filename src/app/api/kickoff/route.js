import { exec } from 'child_process';
import os from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const targetDir = path.join(os.homedir(), 'Crew AI Builds/Marketing/Antigravity/abm_engine');
    
    // Instead of waiting for it to finish (which can take a long time),
    // we just launch it in the background and return a success message immediately.
    // If output tracking is desired, it's better to stream real-time logs,
    // but starting it in the background is the minimalist secure way.
    exec('uv run kickoff', { cwd: targetDir }, (error, stdout, stderr) => {
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
