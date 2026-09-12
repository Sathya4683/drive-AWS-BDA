import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as rds from "aws-cdk-lib/aws-rds";

// stack is a deployable cloudformation unit
// scope would be app (who owns the drive stack)
export class DriveStack extends cdk.Stack {
  // id is the unique identifier for the construct tree node
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // all the resources that's needed from now on mentioned

    // creates a VPC with public + isolated subnets
    const vpc = new ec2.Vpc(this, "DriveVpc", {
      // spread subnets across up to 2 Availability Zones
      maxAzs: 2,

      // no NAT Gateway, so CDK creates isolated subnets
      // instead of private-with-egress subnets
      natGateways: 0,
    });
    // bucket where I will later upload my frontend build files
    const frontendBucket = new s3.Bucket(this, "FrontendBucket");

    // bucket used in the application
    const filesBucket = new s3.Bucket(this, "FilesBucket", {
      // so not really delete old files
      versioned: true,
    });

    // creating security group for our EC2 isntance
    const apiSg = new ec2.SecurityGroup(this, "ApiSecurityGroup", {
      vpc,

      // EC2 -> internet allowed
      allowAllOutbound: true,
    });

    // 0.0.0.0/0 -> anyone from internet can access our EC2 for HTTP
    apiSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    // SSH stuff
    apiSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));

    // same for HTTPS
    apiSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    // for express port doing the same
    apiSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000));

    // DB security group
    const dbSg = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
    });

    dbSg.addIngressRule(
      // any source attached to apiSg allowed to port 5432
      apiSg,
      ec2.Port.tcp(5432),
    );

    // RDS instance
    const database = new rds.DatabaseInstance(this, "DriveDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17,
      }),

      vpc,

      multiAz: false,

      publiclyAccessible: false,

      // Egress - traffic leaving something

      // fixes error "need PrivateWithEgress" as we made NAT 0
      // therefore mention to place postgreSQL within an isolated subnet
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      // 20 GB stoerage
      allocatedStorage: 20,

      securityGroups: [dbSg],

      // RDS = PostgreSQL + actual compute.. therefore
      // need to specify the EC2 instance for AWS to provision internally
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),

      // create a DB user named postgres with random strong password
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
    });

    // EC2 isntance related stuff
    const apiServer = new ec2.Instance(this, "ApiServer", {
      vpc,

      securityGroup: apiSg,

      instanceType: new ec2.InstanceType("t3.micro"),

      machineImage: ec2.MachineImage.latestAmazonLinux2023(),

      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },

      associatePublicIpAddress: true,
    });

    // allowing EC2 to read and write from the user files containing bucket
    filesBucket.grantReadWrite(apiServer);

    // These below are basically asking cdk to output/ print
    // these values
    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: frontendBucket.bucketName,
    });

    new cdk.CfnOutput(this, "FilesBucketName", {
      value: filesBucket.bucketName,
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.dbInstanceEndpointAddress,
    });

    new cdk.CfnOutput(this, "InstanceId", {
      value: apiServer.instanceId,
    });
  }
}
