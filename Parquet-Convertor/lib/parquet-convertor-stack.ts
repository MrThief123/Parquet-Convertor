import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

export class ParquetConvertorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Input bucket
    const inputBucket = new s3.Bucket(this, 'CsvInputBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Output bucket
    const outputBucket = new s3.Bucket(this, 'ParquetOutputBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda function
    const converterFn = new lambda.Function(this, 'CsvToParquetFn', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'handler.main',
      code: lambda.Code.fromAsset('lambda/conversion'),
      environment: {
        OUTPUT_BUCKET: outputBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
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
