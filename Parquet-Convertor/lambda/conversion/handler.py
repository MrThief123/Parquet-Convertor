import json
import os
import boto3
import pandas as pd

s3 = boto3.client("s3")

OUTPUT_PREFIX = "parquet/"

def handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        # Only process CSVs
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
        output_key = OUTPUT_PREFIX + key.replace(".csv", ".parquet")
        s3.upload_file(local_parquet, bucket, output_key)

        print(f"Converted {key} → {output_key}")

    return {
        "statusCode": 200,
        "body": json.dumps("Conversion complete")
    }
