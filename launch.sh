#!/bin/bash

# Thought Drop - Development Launch Script
# This script makes it easy to run the app during development

echo "🚀 Launching Thought Drop..."
echo "📝 Press ⌘+Shift+Space to open the note capture window"
echo "❌ Press Ctrl+C to stop the app"
echo ""

# Change to the project directory
cd "$(dirname "$0")"

# Start the app
npm start
