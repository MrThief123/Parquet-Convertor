import os
import boto3

s3 = boto3.client("s3")

def main(event, context):
    print(event)
    return {"status": "ok"}
