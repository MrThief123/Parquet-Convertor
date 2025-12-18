# Parquet Converter – AWS CDK + Lambda

This project deploys an AWS Lambda function using **AWS CDK (TypeScript)** that converts uploaded **CSV files into Apache Parquet format**.  
It uses a **Lambda Layer** to package heavy Python dependencies such as `pandas` and `pyarrow`.

The system is designed to be:
- Reproducible
- Lambda-runtime compatible
- Easy to extend with new Python libraries

---

## 🧱 Architecture Overview

- **AWS CDK (TypeScript)** – Infrastructure as code
- **AWS Lambda (Python 3.10)** – CSV → Parquet conversion
- **Lambda Layer** – Python dependencies (`pandas`, `pyarrow`, etc.)
- **Amazon S3** – Input CSV files and output Parquet files
- **Docker** – Builds Lambda-compatible dependencies

---

## AWS Configure 

```bash
npm install -g aws-cdk
aws configure
```

### Verify
```bash
aws sts get-caller-identity
```

### Instal Dependencies 
``` bash
docker run --rm -v "$PWD/layer:/layer" public.ecr.aws/sam/build-python3.10:latest \
  pip install -r /layer/requirements.txt --only-binary=:all: -t /layer/python
```
---