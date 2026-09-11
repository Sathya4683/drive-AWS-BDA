import * as cdk from "aws-cdk-lib";

import { DriveStack } from "./stacks/DriveStack";

// just application entry point

// creates root of the construct tree (nothing exists yet, at start)

// construct - more like nodes in the resources graph
const app = new cdk.App();

// adding of a child to the tree
new DriveStack(app, "DriveStack");
