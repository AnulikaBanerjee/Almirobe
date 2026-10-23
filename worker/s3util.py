import io
import os

import boto3
from botocore.config import Config


def s3_client():
    endpoint = os.environ.get("S3_ENDPOINT", "http://localhost:9000")
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=os.environ.get("S3_ACCESS_KEY", "almirobe"),
        aws_secret_access_key=os.environ.get("S3_SECRET_KEY", "almirobe-secret"),
        region_name="us-east-1",
        config=Config(s3={"addressing_style": "path"}),
    )


def bucket() -> str:
    return os.environ.get("S3_BUCKET", "almirobe")


def get_bytes(key: str) -> bytes:
    response = s3_client().get_object(Bucket=bucket(), Key=key)
    return response["Body"].read()


def put_bytes(key: str, body: bytes, content_type: str) -> None:
    s3_client().put_object(Bucket=bucket(), Key=key, Body=body, ContentType=content_type)
