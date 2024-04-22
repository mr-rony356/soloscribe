    # Relative path: server\server.py

from datetime import datetime
import requests
import json
import traceback
from flask_cors import CORS
from flask import Flask, request, jsonify, send_from_directory
from faster_whisper import WhisperModel
from werkzeug.utils import secure_filename
import os
import torch
import librosa
import redis
from rq import Queue
import time

app = Flask(__name__, static_folder='../public', static_url_path='')
CORS(app) 

# Redis connection for task queue
redis_conn = redis.Redis(host='localhost', port=6379)
queue = Queue(connection=redis_conn) 

# Whisper model loading (assuming you have the necessary setup)
if torch.cuda.is_available():
    device = torch.device("cuda")
    model = WhisperModel("base", device="cuda", compute_type="float16")
else:
    device = torch.device("cpu")
    model = WhisperModel("base", device="cpu", compute_type="float32")

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/whisper.js')
def whisper_js():
    return app.send_static_file('whisper.js')

def transcribe_audio(filepath, filename, user_id):
    try:
        print(f"Starting transcription for file: {filename}")
        # ... Whisper transcription logic ...
        print(f"Transcription completed for file: {filename}")

        # ... Redis storage logic ...
        print(f"Results stored in Redis for file: {filename}")

    except Exception as e:
        print(f"Error during transcription for file {filename}: {e}")

        # Perform transcription using Whisper
        segments, info = model.transcribe(filepath, beam_size=5)
        result_text = ''
        for seg in segments:
            result_text += seg.text + '\n'
        result_text = result_text[:-1]
        print(result_text)

        # Get duration using librosa
        duration = librosa.get_duration(filename=filepath, sr=16000) 

        # Store results in Redis (for retrieval by the client)
        redis_conn.hset(f"job:{filename}", "status", "completed")
        redis_conn.hset(f"job:{filename}", "text", result_text)
        redis_conn.hset(f"job:{filename}", "language", info.language)
        redis_conn.hset(f"job:{filename}", "duration", duration)
        redis_conn.hset(f"job:{filename}", "user_id", user_id) 

        # ... additional processing or cleanup ...

    except Exception as e:
        print(f"Error during transcription: {e}")
        redis_conn.hset(f"job:{filename}", "status", "failed")
        # ... log error details ... 

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        print("Transcribe function called")
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        print(f"Filename: {filename}") 
        upload_dir = 'public/userFiles/uploads'
        print(f"Upload directory: {upload_dir}") 
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)

        user_id = request.form.get('user_id')  # Get user ID from request form

        # Enqueue transcription task
        job = queue.enqueue(transcribe_audio, file_path, filename, user_id)

        return jsonify({
            'message': 'Transcription job enqueued',
            'job_id': job.get_id(),
            'filename': filename 
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# API endpoint to get transcription progress
@app.route('/progress/<filename>')
def get_progress(filename):
    progress = redis_conn.hget(f"progress:{filename}", "progress") 
    if progress is None:
        return jsonify({'progress': 0}) 
    return jsonify({'progress': int(progress)})



@app.route('/notion', methods=['POST'])
def send_to_notion():
    try:
        # Log the start of the function
        app.logger.info("send_to_notion function started")

        # Get the JSON data from the request
        data = request.get_json()

        # Log the received data
        app.logger.info("Received data: %s", data)

        # Check if 'transcriptionText' is in the data
        if 'transcriptionText' not in data:
            app.logger.error("No transcriptionText in request")
            return jsonify({'error': 'No transcriptionText in request'}), 400

        # Get the transcriptionText from the data
        transcriptionText = data['transcriptionText']

        # Split the transcriptionText into parts of up to 2000 characters
        parts = [transcriptionText[i:i+2000] for i in range(0, len(transcriptionText), 2000)]

        from datetime import datetime

        from datetime import datetime

        for part in parts:
            # Prepare the request body for the Notion API
            requestBody = {
                "parent": { "page_id": '8c7843c668d64f6a9f27bba2f0e82946' },  # Replace with your page ID
                "properties": {
                    "title": { 
                        "title": [{ 
                            "text": { 
                                "content": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            } 
                        }] 
                    }
                },
                "children": [
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "text": [
                                {
                                    "type": "text",
                                    "text": {
                                        "content": part
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
            # Log the request body
            app.logger.info("Request body: %s", requestBody)

            # Make the POST request to the Notion API
            response = requests.post('https://api.notion.com/v1/pages', 
                                     headers={'Authorization': 'Bearer secret_rSr1biSaAgiIRprf2xNeEwLmOjkhYykUkrq3fISl2nA', 
                                              'Notion-Version': '2021-08-16', 
                                              'Content-Type': 'application/json'}, 
                                     json=requestBody)

            # Log the response status code
            app.logger.info("Response status code: %s", response.status_code)

            # Check if the response status code is not 200
            if response.status_code != 200:
                app.logger.error("Failed to send data to Notion, details: %s", response.text)
                return jsonify({'error': 'Failed to send data to Notion', 'details': response.text}), 500

        # Log the successful end of the function
        app.logger.info("Data sent to Notion successfully")

        # Return a success message
        return jsonify({'message': 'Data sent to Notion successfully'}), 200

    except Exception as e:
        # Log the exception
        app.logger.error("Exception occurred: %s", e)
        app.logger.error("Exception traceback: %s", traceback.format_exc())

        # Return an error message
        return jsonify({'error': str(e)}), 500




@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    filename = secure_filename(file.filename)
    upload_dir = os.path.join('userFiles', 'uploads')  # Updated to a relative path
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)  # Create the directory if it doesn't exist
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    
    
    duration = librosa.get_duration(filename=filepath, sr=16000)  # Assuming a sample rate of 16 kHz
    segments, info = model.transcribe(filepath, beam_size=5)
    print(info.language)
    result_text = ''
    for seg in segments:
        result_text += seg.text + '\n'
    result_text = result_text[:-1]

    # print the recognized text
    print(result_text)

    return jsonify({'language': info.language, 'text': result_text, 'duration': duration}), 200


# AI Code


@app.route('/soloai', methods=['POST'])
def soloai():
    try:
        # Log the start of the function
        app.logger.info("soloai function started")

        # Get the JSON data from the request
        data = request.get_json()

        # Log the received data
        app.logger.info("Received data: %s", data)
        
        # Inspect request data
        print("Request Data:", data)
        print("transcriptionText:", data.get('transcriptionText'))
        print("operation:", data.get('operation'))

        # Check if 'transcriptionText' is in the data
        if 'transcriptionText' not in data:
            app.logger.error("No transcriptionText in request")
            return jsonify({'error': 'No transcriptionText in request'}), 400

        # Get the transcriptionText from the data
        transcriptionText = data['transcriptionText']

        # Check if 'operation' is in the data
        if 'operation' in data:
            operation = data['operation']
            if operation == 'createTitle':
                # Generate a title for the transcription
                titlePrompt = "Create a concise, 3-5 word phrase as a header for the following query, strictly adhering to the 3-5 word limit and avoiding the use of the word 'title'::\n\n" + transcriptionText
                requestBody = {
                    "model": "dolphin-mistral:latest",  # replace with your model name
                    "prompt": titlePrompt,
                    "stream": False
                }
                response = requests.post('http://192.168.0.28:11434/api/generate', json=requestBody)
                if response.status_code != 200:
                    app.logger.error("Failed to generate title, details: %s", response.text)
                    return jsonify({'error': 'Failed to generate title', 'details': response.text}), 500
                generatedTitle = response.json()['response']
                return jsonify({'title': generatedTitle}), 200

        # Check if 'selectedOption' is in the data
        if 'selectedOption' not in data:
            app.logger.error("No selectedOption in request")
            return jsonify({'error': 'No selectedOption in request'}), 400

        # Get the selectedOption from the data
        selectedOption = data['selectedOption']

        # Log the selected option
        app.logger.info("Selected option: %s", selectedOption)

        # Split the transcriptionText into parts of up to 2000 characters
        parts = [transcriptionText[i:i+2000] for i in range(0, len(transcriptionText), 2000)]

        summarized_responses = []

        for part in parts:
            # Prepare the request body for the new API
            requestBody = {
                "model": "dolphin-mistral:latest",  # replace with your model name
                "prompt": selectedOption + "\n\nINPUT:\n\n" + part,
                "stream": False
            }
            # Log the request body
            app.logger.info("Request body: %s", requestBody)

            # Make the POST request to the new API
            response = requests.post('http://192.168.0.28:11434/api/generate', json=requestBody)

            # Log the response status code
            app.logger.info("Response status code: %s", response.status_code)

            # Check if the response status code is not 200
            if response.status_code != 200:
                app.logger.error("Failed to send data to new API, details: %s", response.text)
                return jsonify({'error': 'Failed to send data to new API', 'details': response.text}), 500

            # Add the summarized response to the list
            summarized_responses.append(response.json()['response'])

        # Log the successful end of the function
        app.logger.info("Data sent to new API successfully")

        # Return a success message along with the summarized responses
        return jsonify({'message': 'Data sent to new API successfully', 'summarized_responses': summarized_responses}), 200

    except Exception as e:
        # Log the exception
        app.logger.error("Exception occurred: %s", e)
        app.logger.error("Exception traceback: %s", traceback.format_exc())

        # Return an error message
        return jsonify({'error': str(e)}), 500


# Route to check for completed transcriptions (polling)
@app.route('/completed_transcriptions/<filename>')
def check_transcription_status(filename):
    job_status = redis_conn.hget(f"job:{filename}", "status")
    if job_status == b'completed':
        # Retrieve results from Redis
        result_text = redis_conn.hget(f"job:{filename}", "text")
        language = redis_conn.hget(f"job:{filename}", "language") 
        duration = redis_conn.hget(f"job:{filename}", "duration") 
        user_id = redis_conn.hget(f"job:{filename}", "user_id")
        # ... (Optionally clean up job data in Redis) ...
        return jsonify({
            'status': 'completed',
            'text': result_text.decode(),  
            'language': language.decode(),
            'duration': float(duration),
            'filename': filename,
            'user_id': user_id.decode()
        })
    elif job_status == b'failed':
        # ... retrieve and return error details ...
        pass
    else:
        return jsonify({'status': 'pending'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)