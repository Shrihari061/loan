# bfsi_pipeline/recompute_from_mongo.py

import sys
import json
import time
import threading
import traceback
from modules.utils.mongo_utils import (
    get_extracted_values,
    upsert_ratios,
    upsert_risk,
    upsert_summaries,
)
from modules.manual_ratio_mongo import compute_ratios
from modules.risk_grader_mongo import compute_risk
from modules.generate_summaries_mongo import generate_summaries


# Background heartbeat printer
def heartbeat(label: str, stop_event: threading.Event):
    seconds = 0
    while not stop_event.is_set():
        time.sleep(1)
        seconds += 1
        print(f"[{label}] Still working... {seconds} seconds elapsed")
        sys.stdout.flush()


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python recompute_from_mongo.py <lead_id> <customer_name>"}))
        sys.exit(1)

    lead_id = sys.argv[1]
    customer_name = sys.argv[2]

    try:
        print(f"Step 1: Fetching extracted values for lead_id={lead_id}, customer_name={customer_name}")
        sys.stdout.flush()
        extracted_values = get_extracted_values(lead_id, customer_name)
        if not extracted_values:
            print(json.dumps({"error": f"No extracted values found for {lead_id}, {customer_name}"}))
            sys.exit(1)

        print("Step 2: Computing ratios")
        sys.stdout.flush()
        ratios = compute_ratios(extracted_values)
        upsert_ratios(lead_id, customer_name, ratios)
        print("Ratios computation complete and saved")
        sys.stdout.flush()

        print("Step 3: Computing risk")
        sys.stdout.flush()
        risk = compute_risk(ratios)
        upsert_risk(lead_id, customer_name, risk)
        print("Risk computation complete and saved")
        sys.stdout.flush()

        print("Step 4: Generating summaries (this may take a while)")
        sys.stdout.flush()
        stop_event = threading.Event()
        hb_thread = threading.Thread(target=heartbeat, args=("Summaries", stop_event))
        hb_thread.start()
        try:
            summaries = generate_summaries(extracted_values, ratios, risk)
            upsert_summaries(lead_id, customer_name, summaries)
            print("Summaries generation complete and saved")
            sys.stdout.flush()
        finally:
            stop_event.set()
            hb_thread.join()

        # Final success response
        print(json.dumps({
            "status": "success",
            "lead_id": lead_id,
            "customer_name": customer_name,
            "ratios_updated": True,
            "risk_updated": True,
            "summaries_updated": True
        }))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
