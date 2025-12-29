import json
import os
import boto3
import pandas as pd
from botocore.exceptions import BotoCoreError, ClientError

s3 = boto3.client("s3")

OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]
OUTPUT_PREFIX = "uploads/"

def handler(event, context):
    try:
        record = event["Records"][0]
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        if not key.endswith(".csv"):
            print(f"Skipping non-CSV file: {key}")
            return {
                "statusCode": 200,
                "body": json.dumps("Non-CSV file skipped")
            }

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

        return {
            "statusCode": 200,
            "body": json.dumps("Conversion complete")
        }

    except Exception as e:
        print(f"Error processing {key if 'key' in locals() else 'file'}: {e}")
        raise
