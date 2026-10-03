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


def read_question_file(record, owner_ref):
    """Read only a saved author's object, with bounded memory and no public URL."""
    from fastapi import HTTPException
    from botocore.config import Config
    import boto3

    storage = record.get("storage")
    if not isinstance(storage, dict) or storage.get("bucket") != _bucket_name() or not isinstance(storage.get("key"), str) or not storage["key"].startswith(f"question-builder/{owner_ref}/"):
        raise HTTPException(422, "Rujukan nota tidak sah. Muat naik nota semula.")
    client = boto3.client("s3", region_name=os.getenv("AWS_REGION"), config=Config(connect_timeout=10, read_timeout=30, retries={"max_attempts": 1}))
    result = client.get_object(Bucket=_bucket_name(), Key=storage["key"])
    try:
        if result["ContentLength"] > 10 * 1024 * 1024:
            raise HTTPException(413, "Nota tersimpan melebihi 10 MB.")
        return result["Body"].read(10 * 1024 * 1024 + 1)
    finally:
        result["Body"].close()


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
