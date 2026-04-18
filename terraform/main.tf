terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Assume deploying into the default VPC for this simple setup
data "aws_vpc" "default" {
  default = true
}

# Create a security group to allow SSH, HTTP for Frontend, and HTTP for Jenkins/SonarQube access
resource "aws_security_group" "stayngo_sg" {
  name        = "stayngo-compute-sg"
  description = "StayNGo Security Group for Kubernetes/Jenkins Node"
  vpc_id      = data.aws_vpc.default.id

  # SSH for administration
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Standard HTTP for the Frontend K8s LoadBalancer 
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Commonly used for Jenkins UI
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Commonly used for SonarQube UI
  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic to download docker images, dependencies, etc.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "StayNGo-SG"
  }
}

resource "aws_key_pair" "stayngo_key" {
  key_name   = "stayngo-deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

# Provision the EC2 Instance (VM) where Docker, k3s/minikube, and Jenkins will run
resource "aws_instance" "stayngo_node" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.stayngo_key.key_name
  
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  vpc_security_group_ids = [aws_security_group.stayngo_sg.id]

  # Base user data script to instantly install Docker upon boot
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io unzip curl
              usermod -aG docker ubuntu
              systemctl enable docker
              systemctl start docker
              EOF

  tags = {
    Name = "StayNGo-Node"
    Environment = "Production"
  }
}

output "instance_public_ip" {
  description = "The public IP of the StayNGo Kubernetes Node."
  value       = aws_instance.stayngo_node.public_ip
}
