const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function copyFile(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

async function copyWebviewAssets() {
  await copyFile(
    path.join(__dirname, 'src', 'webview', 'chat.css'),
    path.join(__dirname, 'dist', 'webview', 'chat.css')
  );
}

async function buildExtension() {
  return esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    sourcemap: !production,
    minify: production,
    logLevel: 'info',
  });
}

async function buildWebview() {
  return esbuild.context({
    entryPoints: {
      'webview/chat-ui': 'src/webview/chat-ui.ts',
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    outdir: 'dist',
    sourcemap: !production,
    minify: production,
    logLevel: 'info',
  });
}

async function main() {
  const extensionCtx = await buildExtension();
  const webviewCtx = await buildWebview();

  await copyWebviewAssets();

  if (watch) {
    await extensionCtx.watch();
    await webviewCtx.watch();

    fs.watch(
      path.join(__dirname, 'src', 'webview'),
      { persistent: true },
      async (_eventType, filename) => {
        if (filename === 'chat.css') {
          try {
            await copyWebviewAssets();
            console.log('[watch] copied chat.css');
          } catch (error) {
            console.error('[watch] failed to copy chat.css', error);
          }
        }
      }
    );

    console.log('[watch] build started');
    return;
  }

  await extensionCtx.rebuild();
  await webviewCtx.rebuild();
  await extensionCtx.dispose();
  await webviewCtx.dispose();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});