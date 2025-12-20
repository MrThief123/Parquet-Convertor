import json
import os
import boto3
import pandas as pd
from botocore.exceptions import BotoCoreError, ClientError

s3 = boto3.client("s3")

OUTPUT_PREFIX = "parquet/"
OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]  

def handler(event, context):
    for record in event.get("Records", []):
        try:
            bucket = record["s3"]["bucket"]["name"]
            key = record["s3"]["object"]["key"]

            # Only process CSVs
            if not key.endswith(".csv"):
                print(f"Skipping non-CSV file: {key}")
                continue

            local_csv = "/tmp/input.csv"
            local_parquet = "/tmp/output.parquet"

            # Download CSV from input bucket
            try:
                s3.download_file(bucket, key, local_csv)
                print(f"Downloaded {key} from bucket {bucket}")
            except (BotoCoreError, ClientError) as e:
                print(f"Failed to download {key} from bucket {bucket}: {e}")
                continue  # skip to next record

            # Convert CSV → Parquet
            try:
                df = pd.read_csv(local_csv)
                df.to_parquet(local_parquet, engine="pyarrow")
                print(f"Converted {key} to Parquet")
            except Exception as e:
                print(f"Failed to convert {key} to Parquet: {e}")
                continue  # skip to next record

            # Upload Parquet to output bucket
            try:
                output_key = OUTPUT_PREFIX + key.replace(".csv", ".parquet")
                s3.upload_file(local_parquet, OUTPUT_BUCKET, output_key)
                print(f"Uploaded Parquet {output_key} to bucket {OUTPUT_BUCKET}")
            except (BotoCoreError, ClientError) as e:
                print(f"Failed to upload {output_key} to bucket {OUTPUT_BUCKET}: {e}")

        except KeyError as e:
            print(f"Invalid record structure, missing key: {e}")
        except Exception as e:
            print(f"Unexpected error processing record: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps("Conversion complete")
    }
