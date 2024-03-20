import { Stack, StackProps, aws_opensearchserverless } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

const strAccessPolicy = JSON.stringify(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "./../policy/access-policy.json"),
      "utf-8"
    )
  )
);

const strNetworkPolicy = JSON.stringify(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "./../policy/network-policy.json"),
      "utf-8"
    )
  )
);

const strEncryptPolicy = JSON.stringify(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "./../policy/encryption-policy.json"),
      "utf-8"
    )
  )
);

interface AOSSProps extends StackProps {
  arnPrincipal: string;
}

export class AOSSStack extends Stack {
  constructor(scope: Construct, id: string, props: AOSSProps) {
    super(scope, id, props);

    const collection = new aws_opensearchserverless.CfnCollection(
      this,
      "demo",
      {
        name: "demo",
        description: "vector search demo",
        type: "VECTORSEARCH",
        standbyReplicas: "DISABLED",
      }
    );

    const accessPolicy = new aws_opensearchserverless.CfnAccessPolicy(
      this,
      "accessPolicyDemo",
      {
        name: "demo-access-policy",
        type: "data",
        description: "access policy demo",
        policy: strAccessPolicy,
      }
    );

    const networkPolicy = new aws_opensearchserverless.CfnSecurityPolicy(
      this,
      "networkPolicyDemo",
      {
        name: "network-policy-demo",
        type: "network",
        description: "network policy demo",
        policy: strNetworkPolicy,
      }
    );

    const encryptionPolicy = new aws_opensearchserverless.CfnSecurityPolicy(
      this,
      "encryptionPolicyDemo",
      {
        name: "encryption-policy-demo",
        type: "encryption",
        description: "encryption policy demo",
        policy: strEncryptPolicy,
      }
    );

    collection.addDependency(networkPolicy);
    collection.addDependency(encryptionPolicy);
    collection.addDependency(accessPolicy);
  }
}
