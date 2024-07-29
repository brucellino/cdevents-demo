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

provider "cloudflare" {
  api_token = data.vault_kv_secret_v2.cloudflare_token.data["token"]
}


module "example" {
  source = "../../"
}
