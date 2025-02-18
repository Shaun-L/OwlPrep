import firebase_admin
from firebase_admin import credentials, firestore

# Path to the Firebase credentials JSON file
cred = credentials.Certificate("firebase_credentials.json")  

# Initialize Firebase app
firebase_admin.initialize_app(cred)

# Firestore database instance
db = firestore.client()
