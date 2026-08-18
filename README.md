# HealthVerify

## AI Healthcare Staff Verification System

HealthVerify is a full-stack healthcare staff verification system designed to assist administrators in verifying healthcare professionals such as doctors, nurses, and pharmacists.

The system combines AI-based face verification, document OCR, a React web administration dashboard, a Flutter mobile application, a Flask AI backend, and Firebase services.

## Features

* AI-based face verification
* Healthcare staff registration
* Document OCR verification
* AI confidence and verification results
* Pending verification management
* Approval and rejection workflow
* Admin dashboard
* Role-based access
* Firebase Authentication
* Firebase Firestore
* QR-based public verification
* React web application
* Flutter mobile application
* Flask REST API

## Technology Stack

### Web Frontend

* React
* Vite
* JavaScript
* Tailwind CSS

### Mobile

* Flutter
* Dart

### Backend

* Python
* Flask
* REST API

### AI Technologies

* DeepFace
* Tesseract OCR

### Database and Authentication

* Firebase Authentication
* Firebase Firestore

### Tools

* Git
* GitHub
* VS Code
* Postman

## How the System Works

```text
                    HealthVerify
                         |
              +----------+----------+
              |                     |
         React Web             Flutter Mobile
         Dashboard             Application
              |                     |
              +----------+----------+
                         |
                    Flask REST API
                         |
                +--------+--------+
                |                 |
        Face Verification    Document OCR
            DeepFace          Tesseract
                |                 |
                +--------+--------+
                         |
                  Firebase Services
                Authentication
                    Firestore
```

## AI Verification

### Face Verification

DeepFace is used to compare a submitted face image with a reference image and produce a face-match result and confidence score.

### Document Verification

Tesseract OCR extracts text from uploaded documents. The extracted text and OCR confidence are used as part of the document verification process.

### Verification Results

The system can produce information including:

* Face match status
* Face confidence
* Document confidence
* OCR status
* AI score
* Risk level
* Verification recommendation

## Web Administration Dashboard

The React web application allows authorized administrators to:

* View healthcare staff
* Review pending verifications
* Review AI verification results
* Manage doctors and other healthcare staff
* Approve or reject verification requests
* View verification records
* Access public verification information

## Flutter Mobile Application

The Flutter application provides a mobile interface for the healthcare staff verification process and communicates with the Flask backend through REST APIs.

## Security

The project uses:

* Firebase Authentication
* Firestore security rules
* Role-based access
* Environment variables for local configuration
* Git exclusions for sensitive and generated files

Sensitive files such as `.env` are intentionally excluded from the repository.

## Screenshots

Screenshots will be added here to demonstrate the web dashboard, mobile application, AI verification results, and public QR verification page.

## Project Structure

```text
healthverify/
│
├── ai_backend/
│   ├── ai_service.py
│   ├── app.py
│   └── requirements.txt
│
├── android/
├── ios/
├── linux/
├── macos/
├── web/
├── windows/
│
├── lib/
│   └── main.dart
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── config/
│
├── .env.example
├── .gitignore
├── package.json
├── pubspec.yaml
└── README.md
```

## Environment Variables

Create a local `.env` file based on `.env.example`.

Example:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Do not commit the real `.env` file to GitHub.

## Running the Project

### React Web Application

Install dependencies:

```bash
npm install
```

Create your local `.env` file.

Run the development server:

```bash
npm run dev
```

### Flask AI Backend

Install Python dependencies:

```bash
pip install -r ai_backend/requirements.txt
```

Run the backend:

```bash
python ai_backend/app.py
```

### Flutter Application

Install Flutter dependencies:

```bash
flutter pub get
```

Run the mobile application:

```bash
flutter run
```

## Project Goals

The main goals of HealthVerify are to:

1. Assist healthcare staff verification.
2. Reduce manual verification effort.
3. Combine face and document verification.
4. Provide administrators with a centralized verification dashboard.
5. Provide a public method for confirming approved healthcare staff.

## Future Improvements

* Cloud deployment
* Automated notifications
* Advanced analytics
* Additional verification methods
* Improved AI model optimization
* Production monitoring

## Developer

**Riham Mohammad Al Jazairi**

Bachelor Degree in Computer Science
Islamic University of Lebanon
2025–2026
