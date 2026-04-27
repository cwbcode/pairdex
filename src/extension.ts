import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import * as readline from 'node:readline';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { PairdexViewProvider } from './PairdexViewProvider';

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('Pairdex');

  const provider = new PairdexViewProvider(
    context.extensionUri,
    async (message: unknown) => {
      const typedMessage = message as { type?: string; text?: string };

      if (typedMessage.type === 'sendPrompt' && typedMessage.text?.trim()) {
        await runCodexPrompt(
          typedMessage.text.trim(),
          provider,
          output,
          context
        );
      }
    }
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PairdexViewProvider.viewType,
      provider
    )
  );

  const openOutputCommand = vscode.commands.registerCommand(
    'pairdex.openOutput',
    () => {
      output.show(true);
    }
  );

  context.subscriptions.push(openOutputCommand);
}

export function deactivate() {}

async function runCodexPrompt(
  userMessage: string,
  provider: PairdexViewProvider,
  output: vscode.OutputChannel,
  context: vscode.ExtensionContext
): Promise<void> {
  provider.postMessage({ type: 'status', text: 'Starting Codex...' });

  let proc: ChildProcessWithoutNullStreams;

  try {
    const codexPath = getBundledCodexPath(context);
    output.appendLine(`[codex path] ${codexPath}`);

    proc = spawn(codexPath, ['app-server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      env: { ...process.env },
      shell: process.platform === 'win32',
      windowsHide: true,
    });
  } catch (error) {
    provider.postMessage({
      type: 'error',
      text: String(error),
    });
    return;
  }

  proc.stderr.on('data', (chunk) => {
    output.appendLine(`[stderr] ${chunk.toString()}`);
  });

  proc.on('error', (error) => {
    provider.postMessage({
      type: 'error',
      text: String(error),
    });
  });

  const rl = readline.createInterface({ input: proc.stdout });

  let sentTurn = false;
  let finalAssistantText = '';

  const send = (message: unknown) => {
    const line = JSON.stringify(message);
    output.appendLine(`[client → server] ${line}`);
    proc.stdin.write(`${line}\n`);
  };

  rl.on('line', (line) => {
    output.appendLine(`[server → client] ${line}`);

    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }

    if (!sentTurn && msg.id === 2 && msg.result?.thread?.id) {
      sentTurn = true;

      send({
        method: 'turn/start',
        id: 3,
        params: {
          threadId: msg.result.thread.id,
          input: [{ type: 'text', text: userMessage }],
        },
      });
    }

    if (msg.method === 'item/agentMessage/delta') {
      const delta = msg.params?.delta ?? '';
      finalAssistantText += delta;

      provider.postMessage({
        type: 'assistantDelta',
        text: delta,
      });
    }

    if (
      msg.method === 'item/completed' &&
      msg.params?.item?.type === 'agentMessage'
    ) {
      const finalText = msg.params.item.text ?? finalAssistantText;

      provider.postMessage({
        type: 'assistantFinal',
        text: finalText,
      });
    }

    if (msg.method === 'turn/completed') {
      provider.postMessage({
        type: 'status',
        text: 'Ready',
      });

      proc.kill();
    }
  });

  send({
    method: 'initialize',
    id: 1,
    params: {
      clientInfo: {
        name: 'pairdex',
        version: '0.0.1',
      },
    },
  });

  send({
    method: 'initialized',
    params: {},
  });

  send({
    method: 'thread/start',
    id: 2,
    params: {
      model: 'gpt-5.4',
    },
  });
}

function getBundledCodexPath(context: vscode.ExtensionContext): string {
  const extRoot = context.extensionPath;
  const binName = process.platform === 'win32' ? 'codex.cmd' : 'codex';
  const binPath = path.join(extRoot, 'node_modules', '.bin', binName);

  if (!fs.existsSync(binPath)) {
    throw new Error(`Bundled Codex CLI not found at ${binPath}`);
  }

  return binPath;
}