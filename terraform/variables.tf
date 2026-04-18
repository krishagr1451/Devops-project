variable "aws_region" {
  description = "The AWS region to deploy the infrastructure."
  type        = string
  default     = "ap-south-1" # Mumbai region, as implied by your example
}

variable "instance_type" {
  description = "The EC2 instance type."
  type        = string
  default     = "t2.medium" # t2.medium is generally the minimum for running a single-node k8s cluster (like Minikube or K3s)
}

variable "ami_id" {
  description = "The Ubuntu AMI ID to use."
  type        = string
  default     = "ami-0dee22c13ea7a9a67" # Example public Ubuntu Server 22.04 LTS (HVM) in ap-south-1. Verify this AMI before deployment!
}
