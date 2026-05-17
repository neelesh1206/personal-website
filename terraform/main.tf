# Phase 2 — AWS S3 + CloudFront + OAC deployment
# Activate after Vercel v1 is stable and tested.

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Uncomment when Phase 2 begins:
  # backend "s3" {
  #   bucket = "neelesh-portfolio-tf-state"
  #   key    = "portfolio/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# S3 bucket for static assets
resource "aws_s3_bucket" "portfolio" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "portfolio" {
  bucket                  = aws_s3_bucket.portfolio.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control (OAC — recommended over legacy OAI)
resource "aws_cloudfront_origin_access_control" "portfolio" {
  name                              = "portfolio-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "portfolio" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]

  origin {
    domain_name              = aws_s3_bucket.portfolio.bucket_regional_domain_name
    origin_id                = "S3-portfolio"
    origin_access_control_id = aws_cloudfront_origin_access_control.portfolio.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-portfolio"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # HTML — short TTL (must revalidate for routing layer)
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Hashed assets (JS/CSS) — cache forever (content-addressed)
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "S3-portfolio"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 31536000
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
