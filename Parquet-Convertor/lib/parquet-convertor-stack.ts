import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class ParquetConvertorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Input bucket
    const inputBucket = new s3.Bucket(this, '-InputBucket-', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    inputBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.PUT],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    });

    const uploadUrlFn = new lambda.Function(this, 'PresignUploadFn', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/presign')),
      environment: {
        INPUT_BUCKET: inputBucket.bucketName,
      },
    });

    inputBucket.grantPut(uploadUrlFn);

    const api = new apigw.RestApi(this, 'ParquetApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST'],
      },
    });

    const upload = api.root.addResource('upload-url');
    upload.addMethod('GET', new apigw.LambdaIntegration(uploadUrlFn));

    


    // Output bucket
    const outputBucket = new s3.Bucket(this, '-OutputBucket-', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Converter Lambda
    const requestsLayer = new lambda.LayerVersion(this, 'RequestsLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-layer/layer.zip')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
    });
    const pandasLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'AWSSDKPandasLayer',
      'arn:aws:lambda:ap-southeast-2:336392948345:layer:AWSSDKPandas-Python310:27'
    );

    const converterFn = new lambda.Function(this, 'CsvToParquetFn', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/conversion')),
      environment: { OUTPUT_BUCKET: outputBucket.bucketName },
      timeout: cdk.Duration.seconds(60),
      memorySize: 2048,
    });

    const downloadUrlFn = new lambda.Function(this, 'PresignDownloadFn', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/presign-download')),
      environment: {
        OUTPUT_BUCKET: outputBucket.bucketName,
      },
    });

    converterFn.addLayers(pandasLayer, requestsLayer);
    inputBucket.grantRead(converterFn);
    outputBucket.grantWrite(converterFn);
    outputBucket.grantRead(downloadUrlFn);

    const download = api.root.addResource('download-url');
    download.addMethod('GET', new apigw.LambdaIntegration(downloadUrlFn));


    inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(converterFn),
      { suffix: '.csv' }
    );
  }
}
