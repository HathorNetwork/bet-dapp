# Bet-dapp - SOP

## Pre-requisites

### Tools

- Docker
- AWS CLI
- Terraform (Only if you need to change the infra. Not necessary to deploy new versions in the instance)

### AWS Access

You must configure access to the `Nano-testnet` account in AWS.

Run the following command:

```bash
aws configure sso
```

Set the following values when asked:

- SSO Session Name: `nano-testnet`
- SSO Start URL: `https://hathorlabs.awsapps.com/start`
- SSO Region: `us-east-1`
- SSO Registration Scopes: `sso:account:access`
- In the accounts list, select `Nano-testnet`
- CLI default client region: `us-east-1`
- CLI default output format: `None`
- CLI profile name: `nano-testnet`

Login to the account using the following command:

```bash
aws sso login --profile nano-testnet
```
## Deploying new versions

### Building and pushing the image

```bash
aws ecr get-login-password --region ap-southeast-1 --profile nano-testnet | docker login --username AWS --password-stdin 471112952246.dkr.ecr.ap-southeast-1.amazonaws.com

docker build -t 471112952246.dkr.ecr.ap-southeast-1.amazonaws.com/bet-dapp:latest .

docker push 471112952246.dkr.ecr.ap-southeast-1.amazonaws.com/bet-dapp:latest
```

### Accessing the instance

```bash
# Get the instance IP from its name tag
aws ec2 describe-instances --profile nano-testnet --filters "Name=tag:Name,Values=bet-dapp" --query "Reservations[*].Instances[*].PublicIpAddress" --output text --region ap-southeast-1

ssh ec2-user@<instance-ip>
```

### Login to Docker in the instance

```bash
aws ecr get-login-password --region ap-southeast-1 | sudo docker login --username AWS --password-stdin 471112952246.dkr.ecr.ap-southeast-1.amazonaws.com
```

### Pulling the latest image

The following should be run inside the EC2 instance

```bash
# Inside the home directory (/home/ec2-user)
sudo docker compose pull
```

### Restarting the service

The following should be run inside the EC2 instance

```bash
# Inside the home directory (/home/ec2-user)
# Running this will pick up any changes in the configuration and recreate the container
sudo docker compose up -d
```

## Other operations in the instance

### Checking logs

The following should be run inside the EC2 instance

```bash
# Inside the home directory (/home/ec2-user)
sudo docker compose logs bet-dapp -f
```

### Stopping the service

The following should be run inside the EC2 instance

```bash
# Inside the home directory (/home/ec2-user)
sudo docker compose down
```

### Starting the service

The following should be run inside the EC2 instance

```bash
# Inside the home directory (/home/ec2-user)
sudo docker compose up -d
```

## Inspecting the DynamoDB table in AWS

Go to https://hathorlabs.awsapps.com/start and login to the `Nano-testnet` account.

You can find the table at:
- https://ap-southeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-1#table?name=NanoContracts

Click `Explore table items` to see the items in the table.

## Infra changes

The infra is currently defined in https://github.com/HathorNetwork/ops-tools/tree/master/terraform/bet-dapp

Make sure to run `make terraform-init` to setup the Terraform environment.

### Updating the DybamoDB table definition

The table is defined in the file `terraform/bet-dapp/dynamodb.tf`

Refer to the [Terraform documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dynamodb_table) for more information on how to define the table.

Apply the changes by running:

```bash
make apply
```

You'll be prompted to review the changes before they are applied.

### Changing the instance security group, instance type or other configurations

The instance is defined in the file `terraform/bet-dapp/ec2.tf`

Refer to the Terraform documentation on the following resources for more information on how to define the instance:
- [aws_instance](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance)
- [aws_security_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group)
- [aws_iam_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role)
- [aws_iam_instance_profile](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_instance_profile)
- [aws_iam_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_policy)

Apply the changes by running:

```bash
make apply
```

You'll be prompted to review the changes before they are applied.

### Changing the instance provisioning script

The provisioning script is defined in the file `terraform/bet-dapp/scripts/provision-instance.yaml.tftpl`

It's a cloud-init script that runs when the instance is created.

If changes are needed inside the instance, ideally they should be written in this script and the instance should be recreated by running `make apply`.

This will generate a downtime in the service, so it should be done with caution. To avoid this, you could create a new instance first, test the changes and then switch the Elastic IP to the new instance. Or just make the changes in the running instance, if you're in a hurry, then update the script later.

The Elastic IP is defined in the file `terraform/bet-dapp/ec2.tf`

### Changing the Cloudfront configuration

We had to add a rule in the Cloudfront distribution we use to serve `hathor.network`, in order to have the bet-dapp served under https://hathor.network/betting2024

To update this, you should:

- Login to the `Hathor-website` account through https://hathorlabs.awsapps.com/start
- Access the Cloudfront distribution at https://us-east-1.console.aws.amazon.com/cloudfront/v4/home?region=eu-central-1#/distributions/E2AT2JAIYAKNGG
