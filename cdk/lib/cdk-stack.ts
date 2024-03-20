import {
  Duration,
  Stack,
  StackProps,
  aws_apprunner,
  aws_iam,
  aws_lambda,
} from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";

interface AppRunnerProps extends StackProps {
  ecr: string;
  bucket: string;
  aossCollectionArn: string;
}

export class AppRunnerStack extends Stack {
  constructor(scope: Construct, id: string, props: AppRunnerProps) {
    super(scope, id, props);

    const buildRole = new aws_iam.Role(this, "RoleForAppRunnerPullEcrBedrock", {
      assumedBy: new aws_iam.ServicePrincipal("build.apprunner.amazonaws.com"),
      roleName: "RoleForAppRunnerPullEcrBedrock",
    });

    buildRole.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["ecr:*"],
      })
    );

    const instanceRole = new aws_iam.Role(
      this,
      "InstanceRoleForApprunerBedrock",
      {
        assumedBy: new aws_iam.ServicePrincipal(
          "tasks.apprunner.amazonaws.com"
        ),
        roleName: "InstanceRoleForApprunnerBedrock",
      }
    );

    instanceRole.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v2",
          "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1",
          "arn:aws:bedrock:us-east-1::foundation-model/stability.stable-diffusion-xl-v1",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude*",
        ],
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
      })
    );

    instanceRole.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:aws:s3:::${props.bucket}/*`],
        actions: ["s3:PutObject", "s3:GetObject"],
      })
    );

    instanceRole.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [props.aossCollectionArn],
        actions: ["aoss:APIAccessAll"],
      })
    );

    const autoscaling = new aws_apprunner.CfnAutoScalingConfiguration(
      this,
      "AutoScalingForGoApp",
      {
        autoScalingConfigurationName: "AutoScalingForGoApp",
        // min number instance
        minSize: 1,
        // max number instance
        maxSize: 10,
        // max concurrent request per instance
        maxConcurrency: 100,
      }
    );

    const apprunner = new aws_apprunner.CfnService(this, "NextBedrockService", {
      serviceName: "NextBedrockService",
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: buildRole.roleArn,
        },

        autoDeploymentsEnabled: false,

        imageRepository: {
          imageIdentifier: props.ecr,
          imageRepositoryType: "ECR",
          imageConfiguration: {
            port: "3000",
            runtimeEnvironmentVariables: [
              {
                name: "BUCKET",
                value: props.bucket,
              },
              {
                name: "HOSTNAME",
                value: "0.0.0.0",
              },
              {
                name: "PORT",
                value: "3000",
              },
            ],
            // startCommand: "",
          },
        },
      },

      instanceConfiguration: {
        cpu: "4 vCPU",
        memory: "8 GB",
        instanceRoleArn: instanceRole.roleArn,
      },

      observabilityConfiguration: {
        observabilityEnabled: false,
      },

      autoScalingConfigurationArn: autoscaling.ref,
    });

    apprunner.addDependency(autoscaling);
  }
}

interface LambdaAossProps extends StackProps {
  opensearchDomain: string;
  aossCollectionArn: string;
  bucketName: string;
}

export class LambdaAossStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaAossProps) {
    super(scope, id, props);

    // role for lambda to read opensearch
    const role = new aws_iam.Role(this, "RoleForLambdaIndexAossBedrock", {
      roleName: "RoleForLambdaIndexAossBedrock",
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:aws:s3:::${props.bucketName}/*`],
        actions: ["s3:GetObject"],
      })
    );

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-v2`,
          `arn:aws:bedrock:${this.region}::foundation-model/stability.stable-diffusion-xl-v1`,
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v1`,
        ],
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
      })
    );

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [props.aossCollectionArn],
        actions: ["aoss:APIAccessAll"],
      })
    );

    // lambda function to query opensearch
    new aws_lambda.Function(this, "LamdaQueryOpenSearch", {
      functionName: "LambdaIndexAossBedrock",
      memorySize: 2048,
      timeout: Duration.seconds(300),
      code: aws_lambda.EcrImageCode.fromAssetImage(
        path.join(__dirname, "./../lambda/lambda-index-aoss/")
      ),
      handler: aws_lambda.Handler.FROM_IMAGE,
      runtime: aws_lambda.Runtime.FROM_IMAGE,
      environment: {
        OPENSEARCH_DOMAIN: props.opensearchDomain,
        PYTHONPATH: "/var/task/package",
        REGION: this.region,
        BUCKET: props.bucketName,
      },
      role: role,
    });
  }
}
