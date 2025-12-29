import json
import os
import boto3
import pandas as pd
from botocore.exceptions import BotoCoreError, ClientError

s3 = boto3.client("s3")

OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]
OUTPUT_PREFIX = "uploads/"

def handler(event, context):
    for record in event.get("Records", []):
        try:
            bucket = record["s3"]["bucket"]["name"]
            key = record["s3"]["object"]["key"]

            if not key.endswith(".csv"):
                print(f"Skipping non-CSV file: {key}")
                continue

            local_csv = "/tmp/input.csv"
            local_parquet = "/tmp/output.parquet"

            # Download CSV
            s3.download_file(bucket, key, local_csv)

            # Convert CSV → Parquet
            df = pd.read_csv(local_csv)
            df.to_parquet(local_parquet, engine="pyarrow")

            # Upload Parquet
            filename = key.split("/")[-1].replace(".csv", ".parquet")
            output_key = OUTPUT_PREFIX + filename
            s3.upload_file(local_parquet, OUTPUT_BUCKET, output_key)
            print(f"Uploaded Parquet {output_key} to {OUTPUT_BUCKET}")

        except Exception as e:
            print(f"Error processing {key}: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps("Conversion complete")
    }
