#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AppRunnerStack, LambdaAossStack } from "../lib/cdk-stack";
import { AOSSStack } from "../lib/oass-stack";

const app = new cdk.App();

const ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
const REGION = process.env.CDK_DEFAULT_REGION;

new AOSSStack(app, "AOSSStack", {
  arnPrincipal: "arn:aws:iam::392194582387:user/minh",
});

new AppRunnerStack(app, "NextBedrockAppRunner", {
  bucket: "cdk-entest-videos",
  ecr: `${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com/next-bedrock:latest`,
  aossCollectionArn: `arn:aws:aoss:${REGION}:${ACCOUNT}:collection/yvp6plo4ijurgy8ymhdg`,
  env: {
    region: "us-east-1",
    account: ACCOUNT,
  },
});

new LambdaAossStack(app, "LambdaAossBedrockStack", {
  opensearchDomain: `yvp6plo4ijurgy8ymhdg.us-east-1.aoss.amazonaws.com`,
  aossCollectionArn: `arn:aws:aoss:${REGION}:${ACCOUNT}:collection/yvp6plo4ijurgy8ymhdg`,
  bucketName: "cdk-entest-videos",
});
