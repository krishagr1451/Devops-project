# scheduler.py
import os
from dotenv import load_dotenv

# Ensure environment variables (for DB credentials, CA path) are loaded
load_dotenv()

# We no longer need to run a background cron job for updating room availability.
# The availability check has been rewritten to dynamically evaluate overlaps 
# via SQL (EXISTS) at the exact moment a room is viewed or booked in `app.py`.
# This is a much better, less resource-consuming logic than spinning up a 
# Python process on a cron schedule!

if __name__ == "__main__":
    print("Scheduler logic is deprecated. Availability is computed dynamically on read.")
