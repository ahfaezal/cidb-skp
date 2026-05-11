import os
import re
from datetime import datetime, timezone
from uuid import uuid4


def _bucket_name():
    return os.getenv("AWS_S3_BUCKET") or os.getenv("AWS_BUCKET_NAME")


def is_s3_configured():
    return bool(
        os.getenv("AWS_ACCESS_KEY_ID")
        and os.getenv("AWS_SECRET_ACCESS_KEY")
        and os.getenv("AWS_REGION")
        and _bucket_name()
    )


def _safe_filename(filename: str):
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", filename.strip())
    return cleaned.strip("-") or "upload"


def upload_question_file(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    owner_ref: str,
):
    if not is_s3_configured():
        return None

    import boto3

    bucket = _bucket_name()
    region = os.getenv("AWS_REGION")
    safe_owner = _safe_filename(owner_ref or "local-user")
    safe_name = _safe_filename(filename)
    today = datetime.now(timezone.utc).strftime("%Y/%m/%d")
    key = f"question-builder/{safe_owner}/{today}/{uuid4().hex}-{safe_name}"

    client = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_type or "application/octet-stream",
    )

    return {
        "storage": "s3",
        "bucket": bucket,
        "region": region,
        "key": key,
        "url": f"s3://{bucket}/{key}",
    }
