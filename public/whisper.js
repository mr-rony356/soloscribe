// Relative path: public\whisper.js
import { saveTranscriptionToFirestore, db } from './firebase.js';

var selectedFiles = []; // Define selectedFiles in the global scope

// Add check for null
const el = document.getElementById('someId');
if (el) {
  el.style.display = 'none'; 
}

document.addEventListener('DOMContentLoaded', function () {
    var dropArea = document.getElementById('drag-drop-area');
var fileInput = document.getElementById('file-upload'); // Get the file input element
    var selectedFiles = [];
  
if (!dropArea) {
    console.error('Element with ID "drag-drop-area" not found');
    return;
  }

  if (!fileInput) {
    console.error('Element with ID "file-upload" not found');
    return;
  }

  // Click the hidden file input when the button is clicked
  var fileUploadButton = document.querySelector('.file-upload-btn');
  if (fileUploadButton) {
    fileUploadButton.addEventListener('click', function() {
      fileInput.click();
    });
  } else {
    console.error('Element with class "file-upload-btn" not found');
  }
  
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
  
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    function highlight(e) {
      dropArea.classList.add('highlight');
console.log('Drag entered or over the drop area');
    }
  
    function unhighlight(e) {
      dropArea.classList.remove('highlight');
    console.log('Drag left or dropped on the drop area');
  }

  // Handle file selection via the button
  fileInput.addEventListener('change', function(e) {
    console.log('Files selected via button:', this.files);
    handleFiles(this.files);
  }, false);
  
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
  
    function handleDrop(e) {
      var dt = e.dataTransfer;
      var files = dt.files;
console.log('Files dropped:', files);
      handleFiles(files);
    }
  
    function handleFiles(files) {
console.log('Handling files:', files);
        var fileFormatsText = document.getElementById('file-formats');
        if (files.length > 0 && fileFormatsText) {
            fileFormatsText.style.display = 'none'; // Hide the supported formats text
console.log('Supported formats text hidden');
    } else {
      console.log('No files to handle or "file-formats" element not found');
        }

        ([...files]).forEach(file => {
            selectedFiles.push(file);
            console.log('File added to selectedFiles array:', file);
      displayFile(file); // Assume displayFile is implemented elsewhere
        });
    }


    
    var transcribeButton = document.getElementById('transcribe-now-btn');
transcribeButton.addEventListener('click', function() {
  console.log('Button clicked'); // Debugging line
  selectedFiles.forEach(file => {
    console.log('Uploading file', file.name); // Debugging line
    uploadFile(file);
  });
  selectedFiles = [];
});


// =========================================================================================// 


function uploadFile(file) {
  console.log('In uploadFile function', file.name); // Debugging line
  var formData = new FormData();
  formData.append('file', file);

  fetch('http://solollama.ddns.net:5001/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    // Check if the response's content type is JSON
    var contentType = response.headers.get("content-type");
    if(contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      throw new Error(`Expected JSON but received ${contentType}`);
    }
  })
  .then(data => {
    console.log(`File ${file.name} uploaded successfully`, data);
    const userId = firebase.auth().currentUser.uid; // Get the current user's ID
    const createdDate = new Date(); // Get the current date and time
    const modifiedDate = new Date(); // Get the current date and time
    const duration = data.duration; // Assuming `data.duration` is the duration of the audio
    // Now call Firestore save function
    saveTranscriptionToFirestore(userId, data.text, createdDate, modifiedDate, duration, file.name);
  })
  .catch(error => {
    console.error(`Error uploading file ${file.name}:`, error);
  });
}
    
});

// =========================================================================================// 


function displayFile(file) {
  var fileList = document.getElementById('file-list');
  var fileUploadInstructions = document.getElementById('file-upload-instructions');

  // Create a new list item for the file
  var listItem = document.createElement('div');
  listItem.classList.add('file-row'); // Add class for styling

  // Create text node for file name
  var textNode = document.createTextNode(file.name);
  listItem.appendChild(textNode);

  // Create a trashcan icon
  var trashCan = document.createElement('span');
  trashCan.classList.add('trashcan', 'fas', 'fa-trash-alt'); // Ensure you have the correct class names for Font Awesome
  trashCan.onclick = function() {
    // Remove this file from the list
    listItem.remove();
    // Also remove this file from the selectedFiles array
    selectedFiles = selectedFiles.filter(f => f !== file);
  };

  // Append trashcan to the listItem
  listItem.appendChild(trashCan);

  // Append the listItem to fileList
  fileList.appendChild(listItem);

  // Make sure to unhide the file list if it was hidden
  fileList.style.display = 'block';
  if (fileUploadInstructions) {
    fileUploadInstructions.style.display = 'none';
  }
  updateFileListDisplay();
}


function removeFile(element) {
  // Remove the parent div of the trashcan from the file list
  element.parentElement.remove();

  // Remove the file from selectedFiles
  var indexToRemove = selectedFiles.findIndex(f => f.name === element.parentElement.textContent.trim());
  if (indexToRemove > -1) {
    selectedFiles.splice(indexToRemove, 1);
  }

  // If no more files are selected, show the upload instructions and formats
  if (selectedFiles.length === 0) {
    var fileUploadInstructions = document.getElementById('file-upload-instructions');
    var fileFormatsText = document.getElementById('file-formats');
    fileUploadInstructions.style.display = 'block';
    fileFormatsText.style.display = 'block';
  }

  // Update the list display after removing a file
  updateFileListDisplay();
}
  

const list = document.getElementById('fileList');
if (list) {
  // update list
}



function updateFileListDisplay() {
  const el = document.getElementById('someId');

if(!el) {
  return;
}
  var fileList = document.getElementById('file-list');
  var fileUploadInstructions = document.getElementById('file-upload-instructions');
  var fileFormats = document.getElementById('file-formats');

  // If no files are left in the list, show the upload instructions and formats
  if (fileList.children.length === 0) {
    fileUploadInstructions.style.display = 'block';
    fileFormats.style.display = 'block';
  } else {
    // If there are files in the list, hide the instructions and formats
    // fileUploadInstructions.style.display = 'none';
    fileFormats.style.display = 'none';
  }
}


// Sidebar Menu


document.addEventListener('DOMContentLoaded', function() {
  var sidebarToggle = document.querySelector('.mobile-sidebar-toggle');
  var sidebar = document.getElementById('sidebar');

  if (!sidebar) {
    console.error('No element with ID sidebar');
    return;
  }

  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('open');
  });

  document.addEventListener('click', function(event) {
    if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
      sidebar.classList.remove('open');
    }
  });
});



window.toggleContainer = function(id) {
  // Existing toggle logic
  var mainContainers = document.getElementsByClassName("mainContainers");
  var transControls = document.querySelector('.trans-controls');

  for (var i = 0; i < mainContainers.length; i++) {
    if (mainContainers[i].id !== id) {
      mainContainers[i].style.display = "none"; 
    }
  }

  var container = document.getElementById(id);
  if (container) {
    container.style.display = "block";
    // If the newTranscription container is shown, hide the trans-controls
    if (id === 'newTranscription') {
      transControls.style.display = 'none';
    } else {
      transControls.style.display = 'flex';
    }
  } else {
    console.error("No element with ID " + id);
  }
};



// Transcription data array
const transcriptions = [];


// Handle file upload
function handleFileUpload(file) {

  // Transcribe file
  const transcription = transcribeFile(file);
  console.log('Transcription:', transcription);
  
  // Add to array
  transcriptions.push(transcription);

  // Render latest transcription
  renderLatestTranscription();
  console.log('Latest transcription:', latestTranscription);

}

// Render most recent transcription 
function renderLatestTranscription() {

  // Get transcriptions array
  const transcriptions = getTranscriptions();
  console.log('Transcription:', transcription);


  // Sort by timestamp
  transcriptions.sort((a, b) => b.timestamp - a.timestamp);  

  // Get most recent
  const latestTranscription = transcriptions[0];

  // Render to DOM
  renderTranscription(transcription, document.getElementById('individualTranscription'));

// Save the transcription after it's rendered

  var userId = firebase.auth().currentUser.uid;  // Replace with the actual user ID
  saveTranscription(userId, latestTranscription);

}

// Render single transcription
function renderTranscription(transcription, container) {

  // Clear container
  container.innerHTML = '';

  // Set transcription text
  container.textContent = transcription.text; 
  console.log('Container text set:', container.textContent);

  // Add transcription data
  const title = document.createElement('h2');
  title.textContent = transcription.filename;

  const content = document.createElement('p');
  content.textContent = transcription.text;

  container.appendChild(title);
  container.appendChild(content);

}

// Event listeners


const uploadInput = document.querySelector('input[type="file"]'); 

const input = document.createElement('input');
input.type = 'file';

input.addEventListener('change', handleFileUpload);

document.body.appendChild(input);

document.getElementById('upload-file').addEventListener('click', function() {
  document.getElementById('drag-drop-area').style.display = 'block';
  document.getElementById('podcast-form').style.display = 'none';
  document.getElementById('youtube-form').style.display = 'none';
  document.getElementById('record-form').style.display = 'none';
});

document.getElementById('from-podcast-library').addEventListener('click', function() {
  document.getElementById('podcast-form').style.display = 'block';
  document.getElementById('drag-drop-area').style.display = 'none';
  document.getElementById('youtube-form').style.display = 'none';
  document.getElementById('record-form').style.display = 'none';
});


document.getElementById('from-youtube-link').addEventListener('click', function() {
  document.getElementById('youtube-form').style.display = 'block';
  document.getElementById('drag-drop-area').style.display = 'none';
  document.getElementById('podcast-form').style.display = 'none';
  document.getElementById('record-form').style.display = 'none';

});


document.getElementById('record-audio').addEventListener('click', function() {
  document.getElementById('record-form').style.display = 'block';
  document.getElementById('drag-drop-area').style.display = 'none';
  document.getElementById('podcast-form').style.display = 'none';
  document.getElementById('youtube-form').style.display = 'none';
});

document.getElementById('loginBtn').addEventListener('click', function() {
  // Show the login form when the login/signup button is clicked
  var loginPopup = document.getElementById('login-popup');
  loginPopup.style.display = 'block';
  loginPopup.classList.remove('hidden');
  this.style.display = 'none';
});



//  ================================ Transcription Controls ================================ //



let currentTranscriptId = null; // This variable will hold the current transcript ID

// Function to set the current transcript ID
function setCurrentTranscriptId(id) {
  currentTranscriptId = id;
}

// Attach event listeners to your transcription delete buttons
document.querySelectorAll('.delete-transcription-btn').forEach(button => {
  button.addEventListener('click', function() {
    const docId = this.getAttribute('data-doc-id'); // Assuming you've set data-doc-id attribute to your buttons
    setCurrentTranscriptId(docId); // Save the ID
    // ... you can call delete function or anything else here
  });
});

// Select the individualTranscription container
const individualTranscription = document.getElementById('individualTranscription');


//  ================= Clipboard Function ================= //


// Function to copy transcript to clipboard
function copyToClipboard() {
  console.log('copyToClipboard function called');
  try {
    const transcriptText = individualTranscription.innerText;
    navigator.clipboard.writeText(transcriptText);
    console.log('Transcript copied to clipboard');
  } catch (error) {
    console.error('Failed to copy transcript to clipboard: ', error);
  }
}


//  ================= Share Function ================= //


// Function to share transcript
function shareTranscript() {
  console.log('shareTranscript function called');
  // Implementation depends on how you want to share the transcript
}


//  ================= Notion Function ================= //


document.getElementById('sendToNotionButton').addEventListener('click', function() {
  // Get the transcription text from the div
  var transcriptionText = document.getElementById('individualTranscription').textContent;

  fetch('/notion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ transcriptionText: transcriptionText })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
});


//  ================= Summary Function ================= //


document.querySelector('.dropdown').addEventListener('click', function(event) {
  if (event.target.tagName === 'A') {
    event.preventDefault();
    var selectedOption = event.target.getAttribute('data-option');
    
    // Get the transcription text from the div
    var transcriptionText = document.getElementById('individualTranscription').textContent;
    
    // Get the current user's ID
    var userId = firebase.auth().currentUser.uid;

    // Get the current transcription's filename
    var currentTranscriptionFilename = window.currentFileName;

    var prompt;
    if (selectedOption === 'summarize') {
      prompt = "IDENTITY and PURPOSE\\n\\nYou are an expert content summarizer. You take content in and output a Markdown formatted summary using standard markdown practices. You like to used different font sizes and bold and italic to really make the data easy to read. Take a deep breath and think step by step about how to best accomplish this goal using the following steps. OUTPUT SECTIONS: Output the 5 most important points of the content as a list with no more than 15 words per point into a section called QUICK POINTS:. OUTPUT INSTRUCTIONS: Create the output using the formatting above. You only output human readable Markdown. Output numbered lists. Do not output warnings or notes—just the requested sections. Do not repeat items in the output sections. .\\n\\nTake a deep breath and think step by step about how to best accomplish this goal using the following steps.\\n\\nOUTPUT SECTIONS\\n\\n- Combine all of your understanding of the content into a single, 20-word sentence in a section called ONE SENTENCE SUMMARY:.\\n\\n- Output the 10 most important points of the content as a list with no more than 15 words per point into a section called MAIN POINTS:.\\n\\n- Output a list of the 5 best takeaways from the content in a section called TAKEAWAYS:.\\n\\nOUTPUT INSTRUCTIONS\\n\\n- Create the output using the formatting above.\\n- You only output human readable Markdown.\\n- Output numbered lists, not bullets.\\n- Do not output warnings or notes—just the requested sections.\\n- Do not repeat items in the output sections.\\n- Do not start items with the same opening words.\\n\\nINPUT:\\n\\n" + transcriptionText;
    } else if (selectedOption === 'quickPoints') {
      prompt = "You are an expert content summarizer. You take content in and output a Markdown formatted summary using the proper markdown formatting. You like to used different font sizes and bold and italic to really make the data easy to read. Take a deep breath and think step by step about how to best accomplish this goal using the following steps. OUTPUT SECTIONS: Output the 5 most important points of the content as a list with no more than 15 words per point into a section called QUICK POINTS:. OUTPUT INSTRUCTIONS: Create the output using the formatting above. You only output human readable Markdown. Output numbered lists. Do not output warnings or notes—just the requested sections. Do not repeat items in the output sections. Do not start items with the same opening words. INPUT:" + transcriptionText;
    }

    fetch('/soloai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcriptionText: transcriptionText, selectedOption: selectedOption, prompt: prompt })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);

      // Get a reference to the user's transcriptions collection
      var transcriptionsRef = db.collection("users").doc(userId).collection("transcriptions");

      // Query the transcriptions collection to find the document with the matching filename
      transcriptionsRef.where("filename", "==", currentTranscriptionFilename).get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            // Get the first (and only) document from the query snapshot
            var transcriptionDoc = querySnapshot.docs[0];

            // Update the document with the summary data
            var updateData = {};
            updateData[selectedOption] = data; // Use the selected option as the field name
            transcriptionDoc.ref.update(updateData)
            .then(() => {
              console.log("Document successfully updated!");
            })
            .catch((error) => {
              console.error("Error updating document: ", error);
            });
          } else {
            console.log("No document found with the specified filename.");
          }
        })
        .catch((error) => {
          console.error("Error querying transcriptions: ", error);
        });
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
});


//  ================= View Summary Function ================= //



// Create a new markdown-it instance
var md = window.markdownit();


document.getElementById('viewSummary').addEventListener('click', function() {
  // Get the current user's ID
  var userId = firebase.auth().currentUser.uid;

  // Get the current transcription's filename
  var currentTranscriptionFilename = window.currentFileName;

  // Get a reference to the user's transcriptions collection
  var transcriptionsRef = db.collection("users").doc(userId).collection("transcriptions");

  // Query the transcriptions collection to find the document with the matching filename
  transcriptionsRef.where("filename", "==", currentTranscriptionFilename).get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Get the first (and only) document from the query snapshot
        var transcriptionDoc = querySnapshot.docs[0];

        // Get the summary data
        var summaryData = transcriptionDoc.data().summarize;

        // Check if 'summarized_responses' exists and is an array
        if (summaryData && summaryData.summarized_responses && summaryData.summarized_responses.length > 0) {
          // Get the 'individualTranscription' element
          var individualTranscriptionElement = document.getElementById('individualTranscription');

          // Check if the 'individualTranscription' element exists
          if (individualTranscriptionElement) {
            // Clear the 'individualTranscription' element's content
            individualTranscriptionElement.innerHTML = '';

            // Create a new h2 element for the header
            var summaryHeader = document.createElement('h2');
            // Set the text content of the header
            summaryHeader.textContent = 'Summary';

            // Append the header to the 'individualTranscription' element
            individualTranscriptionElement.appendChild(summaryHeader);

            // Create a new markdown-it instance
            var md = window.markdownit();

            // Iterate over the 'summarized_responses' array
            summaryData.summarized_responses.forEach(summaryText => {
              // Convert the summary text from Markdown to HTML
              var summaryHtml = md.render(summaryText);

              // Create a new div element for the summary text
              var summaryDiv = document.createElement('div');
              // Set the inner HTML of the summary div
              summaryDiv.innerHTML = summaryHtml;

              // Append the summary text to the 'individualTranscription' element
              individualTranscriptionElement.appendChild(summaryDiv);
            });
          } else {
            console.error("No element found with the ID 'individualTranscription'.");
          }
        } else {
          console.log("No summary data available for this transcription.");
        }
      } else {
        console.log("No document found with the specified filename.");
      }
    })
    .catch((error) => {
      console.error("Error querying transcriptions: ", error);
    });
});

//  ================= Delete Function ================= //


// Function to delete transcript
async function deleteTranscript() {
  console.log('deleteTrans function called');
  try {
    const individualTranscription = document.getElementById('individualTranscription');
    const transcriptId = individualTranscription.getAttribute('data-transcript-id');

    console.log('Transcript ID to delete:', transcriptId); // Log the transcript ID

    // Get a reference to the document
    const docRef = db.collection('transcripts').doc(transcriptId);

    // Log the document reference
    console.log('Document reference:', docRef);

    // Delete transcript from Firestore
    const deleteResult = await docRef.delete();
    
    // Log the result of the delete operation
    console.log('Delete result:', deleteResult);

    // Check if the document still exists
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('Document still exists:', doc.data());
    } else {
      console.log('Document does not exist');
    }

    // Clear the individualTranscription element
    individualTranscription.innerText = '';
    individualTranscription.removeAttribute('data-transcript-id'); // Remove the data-transcript-id attribute
    console.log('Transcript deleted from page');

    // Refresh the transcription list and show the next transcript
    await refreshTranscriptionList();
    await showNextTranscript();
  } catch (error) {
    // Log the error with more structured details if possible
    console.error('Failed to delete transcript:', error.message || error);
  }
}
// Function to poll for completed transcriptions
async function checkForCompletedTranscriptions(userId) {
  try {
      const response = await fetch(`/completed_transcriptions/${userId}`);
      if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();

      // Check if data is an object (assuming it's a single transcription)
      if (typeof data === 'object' && data !== null) {
          console.log(`Transcription completed for job: ${data.job_id}`);
          const { filename, text } = data;
          // ... get other details as needed (e.g., duration) ... 

          // Save transcription to Firestore using existing function
          saveTranscriptionToFirestore(userId, text, /* ... other details ... */);

          // Optionally remove the job information from Redis
          // await fetch(`/remove_job/${data.job_id}`, { method: 'DELETE' });
      } else {
          console.log("No completed transcriptions found."); 
      }

  } catch (error) {
      console.error('Error checking for completed transcriptions:', error);
  }
}

// Start polling after a certain interval (e.g., 5 seconds)
setInterval(() => {
  const userId = firebase.auth().currentUser.uid;
  if (userId) {
      checkForCompletedTranscriptions(userId); 
  }
}, 5000);  // Adjust the interval as needed 
