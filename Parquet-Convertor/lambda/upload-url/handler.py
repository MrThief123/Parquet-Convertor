import json
import os
import uuid
import boto3

s3 = boto3.client("s3")
BUCKET = os.environ["INPUT_BUCKET"]

def handler(event, context):
    # Generate a unique key for the uploaded CSV
    key = f"uploads/{uuid.uuid4()}.csv"

    # Generate presigned PUT URL
    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET,
            "Key": key,
            "ContentType": "text/csv",
        },
        ExpiresIn=300  # 5 minutes
    )

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps({
            "uploadUrl": url,
            "key": key
        }),
    }
