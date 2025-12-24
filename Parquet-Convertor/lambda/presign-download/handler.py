import json
import os
import boto3

s3 = boto3.client("s3")
BUCKET = os.environ["OUTPUT_BUCKET"]

def handler(event, context):
    params = event.get("queryStringParameters") or {}
    key = params.get("key")

    if not key:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps("Missing key"),
        }

    url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": BUCKET,
            "Key": key,
        },
        ExpiresIn=300,
    )

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({ "downloadUrl": url }),
    }
