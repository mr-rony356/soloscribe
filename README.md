
# SoLoScribe

## Introduction

SoLoScribe is a web-based transcription service designed to convert audio content into text. It supports various sources, including direct audio uploads, podcasts, and YouTube links. Leveraging Firebase for authentication and storage, along with a Python backend for processing, SoLoScribe offers a seamless experience for users looking to transcribe audio files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [License](#license)

## Installation

### Prerequisites

- Node.js
- Python 3.8+
- Firebase account

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Install Node.js dependencies:
   ```
   npm install
   ```
3. Set up Python virtual environment and install dependencies:
   ```
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## Usage

To start the application:

1. Initialize Firebase:
   - Configure `firebase.js` with your Firebase project credentials.
2. Start the backend server:
   ```
   python server.py
   ```
3. Run the frontend:
   ```
   npm start
   ```
4. Access the web application at `http://localhost:3000`.

## Features

- User authentication (Google)
- Audio file upload for transcription
- Transcription of YouTube and podcast links
- Real-time transcription status updates
- Access to historical transcriptions

## Dependencies

- Firebase for authentication, storage, and database
- Python Flask for the backend API
- Web technologies (HTML, CSS, JavaScript) for the frontend

## Configuration

Ensure to replace placeholders in `firebase.js` with your actual Firebase project configuration.

## Documentation

Further documentation is available in the `docs` directory.

## Examples

Examples of how to use the application are provided in the `examples` directory.

## Troubleshooting

For any issues related to Firebase setup or dependency installation, refer to the respective official documentation or open an issue in the repository.

## Contributors

Contributions are welcome! Please refer to the CONTRIBUTING.md file for guidelines.

## License

SoLoScribe is licensed under the MIT License. See the LICENSE file for more details.
