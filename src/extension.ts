import * as path from 'node:path';
import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import * as readline from 'node:readline';

type JsonRpcMessage = {
	id?: number;
	method?: string;
	params?: any;
	result?: any;
	error?: any;
};

function getBundledCodexPath(context: vscode.ExtensionContext): string {
  const extRoot = context.extensionPath;

  const candidates = process.platform === 'win32'
    ? [
        path.join(extRoot, 'node_modules', '.bin', 'codex.cmd'),
        path.join(extRoot, 'node_modules', '.bin', 'codex.exe'),
      ]
    : [
        path.join(extRoot, 'node_modules', '.bin', 'codex'),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Bundled Codex CLI not found. Looked in:\n${candidates.join('\n')}`
  );
}

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('Agent Bridge Codex');

	const disposable = vscode.commands.registerCommand('agent-bridge.askCodex', async () => {
		const userMessage = await vscode.window.showInputBox({
			prompt: 'Message to Codex',
			placeHolder: 'Explain what this repo does'
		});

		if (!userMessage?.trim()) {
			return;
		}

		output.clear();
		output.show(true);
		output.appendLine('Starting codex app-server...');

		let proc: ChildProcessWithoutNullStreams;
		try {
			const codexPath = getBundledCodexPath(context);
			//TODO: delete debug line
			output.appendLine(`[codex path] ${codexPath}`);

			proc = spawn(codexPath, ['app-server'], {
				stdio: ['pipe', 'pipe', 'pipe'],
				cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				shell: process.platform === 'win32',
				windowsHide: true,
			});
		} catch (err) {
			output.appendLine(`Failed to start bundled codex: ${String(err)}`);
			return;
		}

		proc.stderr.on('data', (chunk) => {
			output.appendLine(`[stderr] ${chunk.toString()}`);
		});

		proc.on('error', (err) => {
			output.appendLine(`[process error] ${String(err)}`);
		});

		proc.on('exit', (code, signal) => {
			output.appendLine(`[exit] code=${code} signal=${signal}`);
		});

		const rl = readline.createInterface({ input: proc.stdout });

		let threadId: string | null = null;
		let sentTurn = false;

		const send = (message: unknown) => {
			const line = JSON.stringify(message);
			output.appendLine(`[client → server] ${line}`);
			proc.stdin.write(`${line}\n`);
		};

		rl.on('line', (line) => {
			output.appendLine(`[server → client] ${line}`);

			let msg: JsonRpcMessage;
			try {
				msg = JSON.parse(line);
			} catch {
				return;
			}

			// After thread/start succeeds, send the first turn
			if (!sentTurn && msg.id === 2 && msg.result?.thread?.id) {
				threadId = msg.result.thread.id;
				sentTurn = true;

				send({
					method: 'turn/start',
					id: 3,
					params: {
						threadId,
						input: [{ type: 'text', text: userMessage.trim() }]
					}
				});
			}

			// crude success heuristic: when we see a completed turn, stop
			if (msg.method === 'turn/completed' || msg.method === 'turn/finished') {
				output.appendLine('Turn completed.');
			}
		});

		// Handshake
		send({
			method: 'initialize',
			id: 1,
			params: {
				clientInfo: {
					name: 'agent-bridge',
					version: '0.0.1'
				}
			}
		});

		send({
			method: 'initialized',
			params: {}
		});

		// Start a thread
		send({
			method: 'thread/start',
			id: 2,
			params: {
				model: 'gpt-5.4'
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}