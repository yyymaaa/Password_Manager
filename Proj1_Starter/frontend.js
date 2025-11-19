"use strict";


// This 'require' will be handled by Browserify
const { Keychain } = require('./password-manager.js');


// This will hold our unlocked keychain instance
let activeKeychain = null;


// Helper function to show messages
function showMessage(text, isError = false) {
    const messageArea = document.getElementById('message-area');
    messageArea.textContent = text;
    messageArea.style.color = isError ? '#d93025' : '#1877f2';
}


// Helper function to show/hide the main app
function showApp(isLoggedIn) {
    document.getElementById('login-section').classList.toggle('hidden', isLoggedIn);
    document.getElementById('keychain-app').classList.toggle('hidden', !isLoggedIn);
}


// Wait for the page to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // --- Get all our HTML elements ---
    const masterPasswordEl = document.getElementById('master-password');
    const serviceNameEl = document.getElementById('service-name');
    const servicePasswordEl = document.getElementById('service-password');
   
    // Auth buttons
    const initBtn = document.getElementById('btn-init');
    const loadBtn = document.getElementById('btn-load');


    // App buttons
    const getBtn = document.getElementById('btn-get');
    const setBtn = document.getElementById('btn-set');
    const removeBtn = document.getElementById('btn-remove');
    const saveBtn = document.getElementById('btn-save');


    // --- Add Event Listeners ---


    /**
     * Initialize a new, empty keychain
     */
    initBtn.addEventListener('click', async () => {
        const password = masterPasswordEl.value;
        if (password.length < 1) {
            return showMessage('Please enter a master password.', true);
        }
       
        try {
            activeKeychain = await Keychain.init(password);
            showMessage('New keychain created! You can now set passwords.');
            showApp(true);
        } catch (err) {
            showMessage(`Error: ${err.message}`, true);
        }
    });


    /**
     * Load an existing keychain from LocalStorage
     */
    loadBtn.addEventListener('click', async () => {
        const password = masterPasswordEl.value;
        if (password.length < 1) {
            return showMessage('Please enter your master password.', true);
        }


        // Get the saved data from the browser's storage
        const contents = localStorage.getItem('keychainContents');
        const checksum = localStorage.getItem('keychainChecksum');


        if (!contents || !checksum) {
            return showMessage('No keychain found in browser storage. Please initialize one first.', true);
        }
       
        try {
            // This is the same function from your tests!
            activeKeychain = await Keychain.load(password, contents, checksum);
            showMessage('Keychain loaded successfully!');
            showApp(true);
        } catch (err) {
            // This will catch "Invalid password!" or "Tampering detected!"
            showMessage(`Error: ${err.message}`, true);
        }
    });


    /**
     * Get a password for a service
     */
    getBtn.addEventListener('click', async () => {
        const name = serviceNameEl.value;
        if (!activeKeychain || !name) return;


        try {
            const password = await activeKeychain.get(name);
            if (password === null) {
                showMessage(`No password found for "${name}".`);
                servicePasswordEl.value = '';
            } else {
                servicePasswordEl.value = password;
                showMessage(`Retrieved password for "${name}".`);
            }
        } catch (err) {
            showMessage(`Error: ${err.message}`, true);
        }
    });


    /**
     * Set a password for a service
     */
    setBtn.addEventListener('click', async () => {
        const name = serviceNameEl.value;
        const value = servicePasswordEl.value;
        if (!activeKeychain || !name || !value) {
            return showMessage('Please provide both service and password.', true);
        }


        try {
            await activeKeychain.set(name, value);
            showMessage(`Password for "${name}" saved!`);
            // Clear inputs after saving
            serviceNameEl.value = '';
            servicePasswordEl.value = '';
        } catch (err) {
            showMessage(`Error: ${err.message}`, true);
        }
    });


    /**
     * Remove a password for a service
     */
    removeBtn.addEventListener('click', async () => {
        const name = serviceNameEl.value;
        if (!activeKeychain || !name) {
            return showMessage('Please provide a service name to remove.', true);
        }


        try {
            const success = await activeKeychain.remove(name);
            if (success) {
                showMessage(`Removed password for "${name}".`);
                serviceNameEl.value = '';
                servicePasswordEl.value = '';
            } else {
                showMessage(`No password found for "${name}", so nothing was removed.`);
            }
        } catch (err) {
            showMessage(`Error: ${err.message}`, true);
        }
    });


    /**
     * Save the (encrypted) keychain to LocalStorage
     */
    saveBtn.addEventListener('click', async () => {
        if (!activeKeychain) return;


        try {
            // This is the same dump() function from your tests
            const [contents, checksum] = await activeKeychain.dump();
           
            // Save the data to the browser
            localStorage.setItem('keychainContents', contents);
            localStorage.setItem('keychainChecksum', checksum);
           
            showMessage('Keychain saved to browser!');
        } catch (err) {
            showMessage(`Error: ${err.message}`, true);
        }
    });


    // --- Initial State ---
    showApp(false); // Hide the app section on load
});
