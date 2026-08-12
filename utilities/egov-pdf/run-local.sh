#!/bin/bash

export DB_USER="postgres"
export DB_PASSWORD="root"
export DB_HOST="localhost"
export DB_NAME="postgres"
export DB_PORT="5432"

# Fallback host for any service not port-forwarded locally
export EGOV_HOST="https://dev-djberp.nitcon.in"

# Specific service hosts based on local port-forwards
export EGOV_MDMS_HOST="http://localhost:8083"
export EGOV_BILLING_HOST="http://localhost:8073"
export EGOV_PDF_HOST="http://localhost:8074"


export APP_PORT="8079"

# KAFKA config if running locally
export KAFKA_BROKER_HOST="127.0.0.1:9092"

echo "Starting egov-pdf service locally on port 8079..."
node ./src/bin/www

