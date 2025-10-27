# scheduler.py
import os
from dotenv import load_dotenv

# Ensure environment variables (for DB credentials, CA path) are loaded
load_dotenv()

# Import your Scheduler class from app.py
from app import Scheduler

if __name__ == "__main__":
    Scheduler.updateRoomAvailability()
