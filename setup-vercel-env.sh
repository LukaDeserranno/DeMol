#!/bin/bash

# Load environment variables from .env
source .env

# Add each environment variable to Vercel
echo "Adding environment variables to Vercel..."

echo "Adding VITE_FIREBASE_API_KEY..."
vercel env add VITE_FIREBASE_API_KEY production <<< $VITE_FIREBASE_API_KEY

echo "Adding VITE_FIREBASE_AUTH_DOMAIN..."
vercel env add VITE_FIREBASE_AUTH_DOMAIN production <<< $VITE_FIREBASE_AUTH_DOMAIN

echo "Adding VITE_FIREBASE_DATABASE_URL..."
vercel env add VITE_FIREBASE_DATABASE_URL production <<< $VITE_FIREBASE_DATABASE_URL

echo "Adding VITE_FIREBASE_PROJECT_ID..."
vercel env add VITE_FIREBASE_PROJECT_ID production <<< $VITE_FIREBASE_PROJECT_ID

echo "Adding VITE_FIREBASE_STORAGE_BUCKET..."
vercel env add VITE_FIREBASE_STORAGE_BUCKET production <<< $VITE_FIREBASE_STORAGE_BUCKET

echo "Adding VITE_FIREBASE_MESSAGING_SENDER_ID..."
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production <<< $VITE_FIREBASE_MESSAGING_SENDER_ID

echo "Adding VITE_FIREBASE_APP_ID..."
vercel env add VITE_FIREBASE_APP_ID production <<< $VITE_FIREBASE_APP_ID

echo "Adding VITE_FIREBASE_MEASUREMENT_ID..."
vercel env add VITE_FIREBASE_MEASUREMENT_ID production <<< $VITE_FIREBASE_MEASUREMENT_ID

echo "All environment variables added successfully!" 