// Array to hold the messages
let messages = [];

// Function to add a message to the chat
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (messageText !== "") {
        messages.push(messageText);
        updateChat();
        messageInput.value = ""; // Clear input after sending
    }
}

// Function to display messages
function updateChat() {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = ""; // Clear current messages

    // Loop through the messages and display them
    messages.forEach(msg => {
        const messageElement = document.createElement('p');
        messageElement.textContent = msg;
        chatMessages.appendChild(messageElement);
    });
}
