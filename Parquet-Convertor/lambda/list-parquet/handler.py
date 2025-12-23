import json
import os
import boto3

s3 = boto3.client("s3")
BUCKET = os.environ["OUTPUT_BUCKET"]

def handler(event, context):
    # List all Parquet files in output bucket
    response = s3.list_objects_v2(Bucket=BUCKET, Prefix="uploads/")
    files = []
    for obj in response.get("Contents", []):
        key = obj["Key"]
        # Generate presigned GET URL for download
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=3600,  # 1 hour
        )
        files.append({"key": key.split('/')[-1], "url": url})

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps(files),
    }
