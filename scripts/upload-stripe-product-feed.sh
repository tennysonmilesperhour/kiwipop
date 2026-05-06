#!/bin/bash
# Upload product feed CSV to Stripe for Agentic Commerce
#
# Usage: ./upload-stripe-product-feed.sh
# Requires: STRIPE_SECRET_KEY environment variable

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FEED_FILE="${SCRIPT_DIR}/../stripe-product-feed.csv"

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Error: STRIPE_SECRET_KEY environment variable not set"
  echo "Get your key from: https://dashboard.stripe.com/apikeys"
  exit 1
fi

if [ ! -f "$FEED_FILE" ]; then
  echo "Error: Product feed file not found at $FEED_FILE"
  exit 1
fi

echo "Uploading product feed to Stripe..."
echo "File: $FEED_FILE"

# Upload the file with purpose 'product_feed'
RESPONSE=$(curl -s -X POST https://files.stripe.com/v1/files \
  -u "$STRIPE_SECRET_KEY:" \
  -F purpose="product_feed" \
  -F file="@$FEED_FILE")

# Extract file ID from response
FILE_ID=$(echo "$RESPONSE" | grep -o '"id": *"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$FILE_ID" ]; then
  echo "Error uploading file:"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "✓ Upload successful!"
echo "File ID: $FILE_ID"
echo ""
echo "Next steps:"
echo "1. Go to: https://dashboard.stripe.com/agentic-commerce"
echo "2. Click 'Create a product feed'"
echo "3. Your feed should now be processing"
echo ""
echo "Feed status API:"
echo "  curl https://api.stripe.com/v1/files/$FILE_ID -u \$STRIPE_SECRET_KEY:"
