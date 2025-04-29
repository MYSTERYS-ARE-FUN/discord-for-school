const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

sendBtn.addEventListener('click', () => {
  const text = inputEl.value.trim();
  if (!text) return;
  addMessage('You', text);
  inputEl.value = '';
});

function addMessage(author, content) {
  const msgEl = document.createElement('div');
  msgEl.classList.add('message');
  msgEl.innerHTML = `<span class="author">${author}:</span> <span class="content">${content}</span>`;
  messagesEl.appendChild(msgEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
