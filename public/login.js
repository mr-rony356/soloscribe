// public/login.js

const auth = firebase.auth();
const db = firebase.firestore;
var provider = new firebase.auth.GoogleAuthProvider();

// Helper function to log messages with a timestamp
function log(message) {
    console.log(new Date().toISOString() + " - " + message);
}

// Get the HTML elements with the respective IDs
var googleLoginButton = document.getElementById('google-login-button');
var loginForm = document.getElementById('login-form');
var signupForm = document.getElementById('signup-form');
var loginPopup = document.getElementById('login-popup');
var signupPopup = document.getElementById('signup-popup');
var signupButton = document.getElementById('signup-button');
var loginButton = document.getElementById('login-button');
var gotoSignupButton = document.getElementById('goto-signup');
var gotoLoginButton = document.getElementById('goto-login');
var logoutButton = document.getElementById('logout-button');
var mainContainer = document.getElementById('mainContainer');

log("Initialized all required variables.");

// Check if variables are null
if (!loginPopup || !signupPopup || !mainContainer) {
    log('One or more elements could not be found.');
}

// Google Login
if (googleLoginButton) {
    googleLoginButton.addEventListener('click', function (e) {
        e.preventDefault();
        auth.signInWithPopup(provider).then(function (result) {
            var user = result.user;
            var userRef = db.collection('users').doc(user.uid);
            userRef.set({
                firstName: user.displayName.split(' ')[0],
                lastName: user.displayName.split(' ')[1],
                email: user.email,
                profilePic: user.photoURL
            }, { merge: true });
            mainContainer.style.display = 'block';
            document.getElementById('login-popup').classList.add('none');
            signupPopup.style.display = 'hidden';
            loginPopup.style.display = 'hidden';
            signupForm.style.display = 'hidden';
            loginForm.style.display = 'hidden';
            log('Google login successful for user: ' + user.email);
        }).catch(function (error) {
            log('Error during Google Login: ' + error.message);
        });
    });
}

// Similar event listeners would be set up for other buttons and forms, following the pattern shown above.



// Handle Signup Button
if (signupButton) {
    signupButton.addEventListener('click', (e) => {
        e.preventDefault();
        loginPopup.style.display = 'none';
        signupPopup.style.display = 'block';
    });
}

// Handle Login Button
if (loginButton) {
    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        signupPopup.style.display = 'none';
        loginPopup.style.display = 'block';
    });
}

// Handle 'Sign Up' Button Inside Login Form
if (gotoSignupButton) {
    gotoSignupButton.addEventListener('click', (e) => {
        e.preventDefault();
        loginPopup.style.display = 'none';
        signupPopup.style.display = 'block';
    });
}

// Handle 'Back to Login' Button Inside Signup Form
if (gotoLoginButton) {
    gotoLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        signupPopup.style.display = 'none';
        loginPopup.style.display = 'block';
    });
}

console.log("Debug: Initialized login and logout buttons");

// Handle Logout Button
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('Debug: User logged out successfully');

            // Hide main content and display login popup
            mainContainer.style.display = 'none';
            loginPopup.style.display = 'block';

            // Clear user info from menu
            document.getElementById('profilePicture').src = '';
            document.getElementById('first-name').innerText = '';
            document.getElementById('last-name').innerText = '';
            document.getElementById('email').innerText = '';

            // Show login button and hide logout button
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';

        }).catch((error) => {
            console.log('Error logging out:', error);
        });
    });
}


// Handle Email/Password Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            mainContainer.style.display = 'block';
            loginPopup.style.display = 'none';
            signupPopup.style.display = 'none';
        } catch (error) {
            alert('An error occurred during login. Please try again.');
        }
    });
}

// Handle Email/Password Signup
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('signup-first-name').value;
        const lastName = document.getElementById('signup-last-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const userRef = db.collection('users').doc(userCredential.user.uid);
            await userRef.set({
                firstName: firstName,
                lastName: lastName,
                email: email
            });
            mainContainer.style.display = 'block';
            loginPopup.style.display = 'none';
            signupPopup.style.display = 'none';
        } catch (error) {
            alert('An error occurred during signup. Please try again.');
        }
    });
}


// Handle Auth State Changes
// Global variable to store the user ID





export { auth, db, provider };
