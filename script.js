// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2mQ7qZWinn8_EXtBVoshiqf79sXOYgvI",
  authDomain: "discord-for-school.firebaseapp.com",
  projectId: "discord-for-school",
  storageBucket: "discord-for-school.firebasestorage.app",
  messagingSenderId: "866436533287",
  appId: "1:866436533287:web:90e5094b5dae15a428d202"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const signupContainer = document.getElementById('signupContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const logoutBtn = document.getElementById('logoutBtn');
const channelsList = document.getElementById('channelsList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const displayUsername = document.getElementById('displayUsername');
const userAvatar = document.getElementById('userAvatar');
const currentChannelName = document.getElementById('currentChannelName');
const currentChannelDescription = document.getElementById('currentChannelDescription');
const createChannelModal = document.getElementById('createChannelModal');
const openCreateChannelModal = document.getElementById('openCreateChannelModal');
const createChannelForm = document.getElementById('createChannelForm');

// Current state
let currentUser = null;
let currentChannelId = null;
let messagesListener = null;

// Event Listeners for Auth
switchToSignup.addEventListener('click', () => {
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'flex';
});

switchToLogin.addEventListener('click', () => {
    signupContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
});

// Custom authentication with username/password
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Find user by username
    db.collection('users').where('username', '==', username).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert('User not found or incorrect password');
                return;
            }
            
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            // Simple password check (in a real app, use Firebase Authentication)
            if (userData.password === password) {
                // Set current user
                currentUser = {
                    uid: userDoc.id,
                    username: userData.username
                };
                
                // Hide auth containers
                loginContainer.style.display = 'none';
                
                // Update UI
                displayUsername.textContent = userData.username;
                userAvatar.textContent = userData.username[0].toUpperCase();
                
                // Load channels
                loadChannels();
            } else {
                alert('Incorrect password');
            }
        })
        .catch((error) => {
            alert('Login error: ' + error.message);
        });
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    
    // Check if username already exists
    db.collection('users').where('username', '==', username).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                alert('Username already exists');
                return;
            }
            
            // Create user in Firestore
            return db.collection('users').add({
                username: username,
                password: password,  // Note: In a real app, use Firebase Auth or hash passwords
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then((docRef) => {
            if (docRef) {
                // Set current user
                currentUser = {
                    uid: docRef.id,
                    username: username
                };
                
                // Hide auth containers
                signupContainer.style.display = 'none';
                
                // Update UI
                displayUsername.textContent = username;
                userAvatar.textContent = username[0].toUpperCase();
                
                // Load channels
                loadChannels();
                
                // Clear form
                document.getElementById('signupUsername').value = '';
                document.getElementById('signupPassword').value = '';
            }
        })
        .catch((error) => {
            alert('Signup error: ' + error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    // Clear current user
    currentUser = null;
    
    // Show login container
    loginContainer.style.display = 'flex';
    
    // Clear current channel
    currentChannelId = null;
    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }
    
    // Clear UI
    channelsList.innerHTML = '';
    messagesContainer.innerHTML = '';
});

// Create Channel Modal
openCreateChannelModal.addEventListener('click', () => {
    createChannelModal.style.display = 'flex';
});

createChannelModal.addEventListener('click', (e) => {
    if (e.target === createChannelModal) {
        createChannelModal.style.display = 'none';
    }
});

createChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const channelName = document.getElementById('channelName').value;
    const channelDescription = document.getElementById('channelDescription').value || '';
    
    db.collection('channels').add({
        name: channelName,
        description: channelDescription,
        createdBy: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        createChannelModal.style.display = 'none';
        document.getElementById('channelName').value = '';
        document.getElementById('channelDescription').value = '';
    })
    .catch((error) => {
        alert('Error creating channel: ' + error.message);
    });
});

// Handle message sending
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim() !== '' && currentChannelId) {
        const messageText = messageInput.value.trim();
        
        db.collection('channels').doc(currentChannelId).collection('messages').add({
            text: messageText,
            userId: currentUser.uid,
            username: currentUser.username,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            messageInput.value = '';
        })
        .catch((error) => {
            alert('Error sending message: ' + error.message);
        });
    }
});

// Load channels
function loadChannels() {
    db.collection('channels').orderBy('createdAt').onSnapshot((snapshot) => {
        channelsList.innerHTML = '';
        
        // If no channels exist, create a default one
        if (snapshot.empty) {
            db.collection('channels').add({
                name: 'general',
                description: 'General chat for everyone',
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return;
        }
        
        snapshot.forEach((doc) => {
            const channel = doc.data();
            const channelId = doc.id;
            
            const channelElement = document.createElement('div');
            channelElement.className = 'channel';
            channelElement.textContent = '# ' + channel.name;
            
            // Set as active if it's the current channel
            if (channelId === currentChannelId) {
                channelElement.classList.add('active');
            }
            
            channelElement.addEventListener('click', () => {
                setActiveChannel(channelId, channel.name, channel.description);
            });
            
            channelsList.appendChild(channelElement);
            
            // Set the first channel as active if none is selected
            if (!currentChannelId) {
                setActiveChannel(channelId, channel.name, channel.description);
            }
        });
    });
}

// Set active channel and load messages
function setActiveChannel(channelId, channelName, channelDescription) {
    // Remove active class from all channels
    const channelElements = document.querySelectorAll('.channel');
    channelElements.forEach(el => el.classList.remove('active'));
    
    // Add active class to the clicked channel
    const activeIndex = Array.from(channelElements).findIndex(el => el.textContent === '# ' + channelName);
    if (activeIndex !== -1) {
        channelElements[activeIndex].classList.add('active');
    }
    
    // Update UI
    currentChannelId = channelId;
    currentChannelName.textContent = '# ' + channelName;
    currentChannelDescription.textContent = channelDescription || '';
    messageInput.placeholder = `Message #${channelName}`;
    
    // Clear messages container
    messagesContainer.innerHTML = '';
    
    // Detach old listener if exists
    if (messagesListener) {
        messagesListener();
    }
    
    // Attach new listener for messages
    messagesListener = db.collection('channels').doc(channelId).collection('messages')
        .orderBy('createdAt')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    displayMessage(message);
                }
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

// Display a message in the UI
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    // Format timestamp
    let timestamp = 'Just now';
    if (message.createdAt) {
        const date = message.createdAt.toDate();
        timestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Get first letter of username for avatar
    const firstLetter = (message.username || 'A')[0].toUpperCase();
    
    messageElement.innerHTML = `
        <div class="message-avatar">${firstLetter}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${message.username || 'Anonymous'}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

// Show login container on page load
document.addEventListener('DOMContentLoaded', () => {
    loginContainer.style.display = 'flex';
});