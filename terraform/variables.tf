variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name for portfolio assets"
  type        = string
  default     = "neeleshkakaraparthi-portfolio"
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = "neeleshkakaraparthi.dev"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1 for CloudFront)"
  type        = string
  default     = ""
}
