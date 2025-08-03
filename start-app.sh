#!/bin/bash

# A script to reliably start the Cynclaim React application,
# preventing common "port already in use" errors.

# --- CONFIGURATION ---
PORT_TO_CHECK=3000
APP_NAME="Cynclaim Expense App"

# --- COLORS ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- FUNCTIONS ---
function check_and_kill_port() {
    echo -e "${YELLOW}Checking if port $PORT_TO_CHECK is in use...${NC}"
    
    # Find the Process ID (PID) using the specified port
    PID=$(lsof -ti:$PORT_TO_CHECK)
    
    if [ -z "$PID" ]; then
        echo -e "${GREEN}Port $PORT_TO_CHECK is free.${NC}"
    else
        echo -e "${RED}Port $PORT_TO_CHECK is currently being used by PID: $PID.${NC}"
        echo -e "${RED}This is likely a leftover process from a previous session.${NC}"
        echo -e "${YELLOW}Terminating the process to free up the port...${NC}"
        
        # Kill the process
        kill -9 $PID
        
        # Verify it's gone
        if [ -z "$(lsof -ti:$PORT_TO_CHECK)" ]; then
            echo -e "${GREEN}Process terminated successfully. Port $PORT_TO_CHECK is now available.${NC}"
        else
            echo -e "${RED}Failed to terminate the process. Please close it manually.${NC}"
            exit 1
        fi
    fi
}

# --- SCRIPT EXECUTION ---
echo -e "\n🚀 Starting the ${GREEN}${APP_NAME}${NC}...\n"

# 1. Clean up the port
check_and_kill_port

# 2. Install any missing dependencies
echo -e "\n${YELLOW}Ensuring all dependencies are installed...${NC}"
npm install

# 3. Start the application
echo -e "\n${GREEN}Starting the Vite development server on port $PORT_TO_CHECK...${NC}"
npm start