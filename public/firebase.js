// Relative path: public\firebase.js



import { setCurrentUserId, getCurrentUserId } from './userState.js';
console.log("Starting Firebase modules import.");

// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyDU-UooKI0sj5Zdz65ygLiqoVG8f5tWHmI',
    authDomain: 'solotranscribe.firebaseapp.com',
    projectId: 'solotranscribe',
    storageBucket: 'solotranscribe.appspot.com',
    messagingSenderId: '176378987408',
    appId: '1:176378987408:web:96109d381ba951bb25e915',
    measurementId: 'G-2K62ZRTW2E'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log("Firebase app initialized successfully.");

// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
var db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log("Firebase services initialized successfully.");
// Define userId as a global variable
// Now you can use userId in your code


// Save the transcription
export async function saveTranscriptionToFirestore(userId, transcriptionText, createdDate, modifiedDate, duration, timestamp) {
    // Reference to the Firestore collection
    const collectionRef = firebase.firestore().collection('users').doc(userId).collection('transcriptions');
  
    // Check if timestamp is valid, if not, set it to the current date and time
    let timestampDate;
    if (timestamp && !isNaN(Date.parse(timestamp))) {
      timestampDate = new Date(timestamp);
    } else {
      console.log('Adding Timestamp');
      timestampDate = new Date();
    }
  
    // Format the timestamp
    var formattedTimestamp = timestampDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
    // Format the duration
    var durationDate = new Date(duration * 1000);
    var formattedDuration = durationDate.getUTCHours() + ':' + durationDate.getUTCMinutes() + ':' + durationDate.getUTCSeconds();
  
    try {
      // Make a request to the /soloai route to create a title for the transcription
      const response = await fetch('/soloai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcriptionText: transcriptionText, operation: 'createTitle' })
      });
  
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
  
      const data = await response.json();
      const generatedTitle = data.title;
  
      // Add a new document to the collection with the generated title
      collectionRef.add({
        transcription: transcriptionText,
        createdDate: createdDate,
        modifiedDate: modifiedDate,
        duration: formattedDuration,
        filename: generatedTitle,
        timestamp: formattedTimestamp
      })
      .then((docRef) => {
        // Add a delay before calling getTranscriptions
        setTimeout(async () => {
          try {
            await getTranscriptions(userId);
            console.log('Transcription saved to Firestore successfully with ID: ', docRef.id);
          } catch (error) {
            console.error('Error getting transcriptions after saving:', error);
          }
        }, 1000); // Delay of 1 second
      })
      .catch(error => {
        console.error('Error saving transcription to Firestore:', error);
      });
    } catch (error) {
      console.error('Error creating title:', error);
    }
  }
export function getTranscriptions(userId) {
    return new Promise((resolve, reject) => {
        const collectionRef = firebase.firestore().collection('users').doc(userId).collection('transcriptions');

        collectionRef.orderBy('modifiedDate', 'desc').get()
            .then((querySnapshot) => {
                const transcriptionsList = document.getElementById('transcriptions-list');
                transcriptionsList.className = 'transcriptions-list';
                transcriptionsList.innerHTML = '';

                if (querySnapshot.empty) {
                    transcriptionsList.textContent = 'No transcriptions available.';
                    reject('No transcriptions found.');
                } else {
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        const listItem = document.createElement('a');
                        listItem.className = 'listItemClass';

                        let createdDate = data.createdDate.toDate();
                        let formattedCreatedDate = createdDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                        listItem.innerHTML = `
                          <div class="file-edit-container" style="display: flex; align-items: center;">
                            <div class="filename" style="font-size: 1.5em; font-weight: bold; margin-top: 12px;" contenteditable="false">${data.filename}</div>
                            <div class="dropdown">
                                <i class="fa-solid fa-ellipsis-vertical dropbtn"></i>
                                <div class="dropdown-content">
                                    <a href="#" class="edit-button">Edit</a>
                                    <a href="#" class="delete-button">Delete</a>
                                </div>
                            </div>
                          </div>
                          <div class="timestamp" style="font-size: 0.9em; margin-top: 10px;">${formattedCreatedDate}</div>
                          <div class="duration" style="font-size: 0.9em;">Duration: ${data.duration}</div>
                        `;

                        const filenameElement = listItem.querySelector('.filename');
                        const editButton = listItem.querySelector('.edit-button');
                        const deleteButton = listItem.querySelector('.delete-button');

                        editButton.addEventListener('click', function(event) {
                          event.preventDefault();
                          const isEditing = filenameElement.isContentEditable;
                          filenameElement.contentEditable = !isEditing;

                          if (isEditing) {
                            const newFilename = filenameElement.textContent;
                            collectionRef.doc(doc.id).update({ filename: newFilename });
                          }
                        });

                        deleteButton.addEventListener('click', function(event) {
                          event.preventDefault();
                          event.stopPropagation(); // Prevent triggering listItem's onclick event
                          collectionRef.doc(doc.id).delete().then(() => {
                            listItem.remove(); // Remove the listItem from the DOM
                          }).catch((error) => {
                            console.error('Error deleting document: ', error);
                          });
                        });

                        filenameElement.addEventListener('keydown', function(event) {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                editButton.click();
                            }
                        });

                        listItem.onclick = function(event) {
                            event.preventDefault();
                            var listItems = document.querySelectorAll('.listItemClass');
                            listItems.forEach(function(item) {
                                item.classList.remove('selected');
                            });
                            this.classList.add('selected');
                            var individualTranscription = document.getElementById('individualTranscription');
                            individualTranscription.textContent = data.transcription;
                            individualTranscription.setAttribute('data-transcript-id', doc.id);
                            window.currentFileName = doc.data().filename;
                            individualTranscription.style.display = 'block';
                            document.getElementById('newTranscription').style.display = 'none';
                            var transControls = document.querySelector('.trans-controls');
                            transControls.style.display = 'flex';
                        };
                        transcriptionsList.appendChild(listItem);
                    });
                    resolve();
                }
            })
            .catch((error) => {
                console.error('Error getting transcriptions from Firestore:', error);
                reject(error);
            });
    });
}


    
// Handle Auth State Changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        setCurrentUserId(user.uid);
        console.log('Debug: User logged in');

        // Set the userId to the logged-in user's UID
        const userId = getCurrentUserId();

        // Check if userId is not null before getting transcriptions
        if (userId) {
            // Now use this userId to get transcriptions
            getTranscriptions(userId);
        }

        // Update user info in the UI
        document.getElementById('profilePicture').src = user.photoURL;
        document.getElementById('first-name').innerText = user.displayName.split(' ')[0];
        document.getElementById('last-name').innerText = user.displayName.split(' ')[1];
        document.getElementById('email').innerText = user.email;

        // UI updates
        logoutBtn.style.display = 'block';
        loginBtn.style.display = 'none';
    } else {
        // User is signed out
        console.log('Debug: User not logged in');
        setCurrentUserId(null);

        // UI updates
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
});


// Assuming `transcriptionsRef` is a reference to your transcriptions collection
var transcriptionsRef = db.collection('transcriptions');

// Listen for when a new transcription is added
transcriptionsRef.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
        if (change.type === "added") {
            // A new document has been added
            var newTranscription = change.doc.data();

            // Update the transcription list
            // This will depend on how your transcription list is structured
            // Here's an example assuming it's an unordered list with the ID "transcription-list"
            var transcriptionList = document.getElementById('transcription-list');
            if (transcriptionList) {
                var newItem = document.createElement('li');
                newItem.textContent = newTranscription.text; // Replace with the actual transcription text property
                transcriptionList.appendChild(newItem);
            }
        }
    });
});

// Get all transcriptions
var transcriptions = document.querySelectorAll('.transcription');

// Add click event listener to each transcription
transcriptions.forEach(function(transcription) {
    transcription.addEventListener('click', function() {
        // Remove selected class from all transcriptions
        transcriptions.forEach(function(other) {
            other.classList.remove('selected');
        });

        // Add selected class to clicked transcription
        this.classList.add('selected');
    });
});

export function showTransControls(containerId) {
    var container = document.getElementById(containerId);
    var transControls = document.querySelector('.trans-controls');
  
    if (container.style.display === 'none' || container.style.display === '') {
      container.style.display = 'block';
      transControls.style.display = 'none';
    } else {
      container.style.display = 'none';
      transControls.style.display = 'flex';
    }
  }

window.onload = function() {
    // Get the upload-section and newTranscription containers
    var uploadSection = document.getElementById('upload-section');
    var newTranscription = document.getElementById('newTranscription');
    var transControls = document.querySelector('.trans-controls'); // Add missing variable declaration

    // Set the display properties
    uploadSection.style.display = 'block';  // Change 'block' to the appropriate value if needed
    newTranscription.style.display = 'block';
    transControls.style.display = 'none'; // Update the code to set the display property of trans-controls to 'none'
}

// Exporting the required objects
export { auth, db, googleProvider };

export default firebase;