output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.ecommerce.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.ecommerce.public_dns
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}