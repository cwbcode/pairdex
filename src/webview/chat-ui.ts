type IncomingMessage =
  | { type: 'status'; text: string }
  | { type: 'assistantDelta'; text: string }
  | { type: 'assistantFinal'; text: string }
  | { type: 'error'; text: string };

type OutgoingMessage = { type: 'sendPrompt'; text: string };

declare function acquireVsCodeApi(): {
  postMessage(message: OutgoingMessage): void;
};

const vscode = acquireVsCodeApi();

const messagesEl = document.getElementById('messages') as HTMLDivElement;
const inputEl = document.getElementById('input') as HTMLTextAreaElement;
const sendButtonEl = document.getElementById('send') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

if (!messagesEl || !inputEl || !sendButtonEl || !statusEl) {
  throw new Error('Missing required chat UI elements.');
}

let currentAssistantMessageEl: HTMLDivElement | null = null;
let isBusy = false;

function setBusy(nextBusy: boolean): void {
  isBusy = nextBusy;
  inputEl.disabled = nextBusy;
  sendButtonEl.disabled = nextBusy;
  statusEl.textContent = nextBusy ? 'Thinking…' : 'Ready';
}

function appendMessage(role: 'user' | 'assistant' | 'system', text: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = `message message--${role}`;

  const label = document.createElement('div');
  label.className = 'message__label';
  label.textContent = role === 'user' ? 'You' : role === 'assistant' ? 'Pairdex' : 'Status';

  const body = document.createElement('div');
  body.className = 'message__body';
  body.textContent = text;

  wrapper.appendChild(label);
  wrapper.appendChild(body);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return wrapper;
}

function sendPrompt(): void {
  const text = inputEl.value.trim();
  if (!text || isBusy) {
    return;
  }

  appendMessage('user', text);
  inputEl.value = '';
  currentAssistantMessageEl = appendMessage('assistant', '');
  setBusy(true);

  vscode.postMessage({
    type: 'sendPrompt',
    text,
  });
}

sendButtonEl.addEventListener('click', sendPrompt);

inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});

window.addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'status':
      statusEl.textContent = message.text;
      break;

    case 'assistantDelta': {
      if (!currentAssistantMessageEl) {
        currentAssistantMessageEl = appendMessage('assistant', '');
      }

      const body = currentAssistantMessageEl.querySelector('.message__body');
      if (body instanceof HTMLDivElement) {
        body.textContent += message.text;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      break;
    }

    case 'assistantFinal': {
      if (!currentAssistantMessageEl) {
        currentAssistantMessageEl = appendMessage('assistant', message.text);
      } else {
        const body = currentAssistantMessageEl.querySelector('.message__body');
        if (body instanceof HTMLDivElement) {
          body.textContent = message.text;
        }
      }

      setBusy(false);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      break;
    }

    case 'error':
      appendMessage('system', `Error: ${message.text}`);
      setBusy(false);
      currentAssistantMessageEl = null;
      break;
  }
});

setBusy(false);