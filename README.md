# CSV to Parquet Converter – AWS CDK + Lambda

This project deploys an **AWS Lambda–based CSV to Apache Parquet converter** using **AWS CDK (TypeScript)**.  
When a CSV file is uploaded to Amazon S3, a Lambda function converts it into Parquet format and writes the result back to S3.

The solution is designed to be:
- Reproducible
- Lambda-runtime compatible
- Easy to extend with additional Python libraries
- Optimized for analytics workloads

---

## Why Parquet?

Apache Parquet is a columnar storage format built for efficient data processing and analytics.

**Key benefits:**
- **Columnar storage** – Reads only required columns, reducing I/O
- **Better compression** – Smaller file sizes than CSV
- **Faster queries** – Optimized for engines like Athena, Spark, DuckDB, and Trino
- **Schema enforcement** – Preserves data types instead of treating all values as strings
- **Cloud-native** – Ideal for data lakes on S3

---

## 🧱 Architecture Overview

- **AWS CDK (TypeScript)** – Infrastructure as code
- **AWS Lambda (Python 3.10)** – Handles CSV → Parquet conversion
- **Lambda Layer** – Packages heavy Python dependencies (`pandas`, `pyarrow`)
- **Amazon S3** – Stores input CSV files and output Parquet files
- **Docker** – Builds Lambda-compatible Python dependencies

---

## Project Flow

1. CSV file is uploaded to an S3 bucket
2. Lambda function is triggered
3. CSV is read into memory using `pandas`
4. File is converted to Parquet using `pyarrow`
5. Parquet file is written back to S3

---

## AWS Configuration

### Install AWS CDK
```bash
npm install -g aws-cdk

aws configure

aws sts get-caller-identity

docker run --rm -v "$PWD/layer:/layer" public.ecr.aws/sam/build-python3.10:latest \
  pip install -r /layer/requirements.txt --only-binary=:all: -t /layer/python
```

## Deploy & Destroy
### Deploy the Stack
```bash
cdk deploy --require-approval never
```

### Destroy the Stack
``` bash
cdk destroy --force

