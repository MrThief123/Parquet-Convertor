import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';

export class ParquetConvertorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Input bucket
    const inputBucket = new s3.Bucket(this, '-InputBucket-', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Output bucket
    const outputBucket = new s3.Bucket(this, '-OutputBucket-', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda layer for parquet library
    const parquetLayer = new lambda.LayerVersion(this, 'ParquetLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../layer')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
    });

    // Lambda function
    const converterFn = new lambda.Function(this, 'CsvToParquetFn', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/conversion')
      ),
      environment: {
        OUTPUT_BUCKET: outputBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 2048,
    });

    // Permissions
    inputBucket.grantRead(converterFn);
    outputBucket.grantWrite(converterFn);

    // Trigger Lambda on CSV upload
    inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(converterFn),
      { suffix: '.csv' }
    );
  }
}
