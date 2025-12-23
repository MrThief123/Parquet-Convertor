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
      allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
      allowedOrigins: ['http://localhost:3000'],
      allowedHeaders: ['*'],
    });


    // Output bucket
    const outputBucket = new s3.Bucket(this, '-OutputBucket-', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const uploadUrlFn = new lambda.Function(this, 'UploadUrlFn', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/upload-url')
      ),
      environment: {
        INPUT_BUCKET: inputBucket.bucketName,
      },
    });

    inputBucket.grantPut(uploadUrlFn);


    const requestsLayer = new lambda.LayerVersion(this, 'RequestsLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda-layer/layer.zip')
      ),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
    });

    const pandasLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'AWSSDKPandasLayer',
      'arn:aws:lambda:ap-southeast-2:336392948345:layer:AWSSDKPandas-Python310:27'
    );

    // Attach the layer to the Lambda
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

    converterFn.addLayers(pandasLayer);
    converterFn.addLayers(requestsLayer);

    // Permissions
    inputBucket.grantRead(converterFn);
    outputBucket.grantWrite(converterFn);

    // Trigger Lambda on CSV upload
    inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(converterFn),
      { suffix: '.csv' }
    );

    

    const api = new apigw.RestApi(this, 'UploadApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['GET'],
      },
    });

    const upload = api.root.addResource('upload');
    upload.addMethod('GET', new apigw.LambdaIntegration(uploadUrlFn));

    new cdk.CfnOutput(this, 'UploadApiUrl', {
      value: api.url + 'upload',
    });
  }
}
