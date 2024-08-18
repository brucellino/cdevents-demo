# This is the default example
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6"
    }
  }
  backend "consul" {
    scheme = "http"
    path   = "terraform/cloudflare-cd"
  }
}
provider "vault" {}

data "vault_kv_secret_v2" "cloudflare_token" {
  mount = "cloudflare"
  name  = "eoscnode.org"
}

data "vault_kv_secret_v2" "github" {
  mount = "kv"
  name  = "github"
}

provider "cloudflare" {
  api_token = data.vault_kv_secret_v2.cloudflare_token.data["token"]
}

provider "github" {
  owner = "brucellino"
  token = data.vault_kv_secret_v2.github.data["laptop"]
}

module "example" {
  source = "../../"
}
