import json
import os
import uuid
import boto3

s3 = boto3.client("s3")
BUCKET = os.environ["INPUT_BUCKET"]

def handler(event, context):
    file_id = str(uuid.uuid4())
    key = f"uploads/{file_id}.csv"

    url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET,
            "Key": key,
            "ContentType": "text/csv",
        },
        ExpiresIn=300,
    )

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "uploadUrl": url,
            "key": key
        }),
    }
