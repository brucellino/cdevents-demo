# Main definition

# Get Cloudflare account
data "cloudflare_accounts" "mine" {}

# Create kv namespace
resource "cloudflare_workers_kv_namespace" "app" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  title      = "cd-app"
}

resource "cloudflare_workers_kv" "webhook_secret" {
  account_id   = data.cloudflare_accounts.mine.accounts[0].id
  key          = "webhook_secret"
  namespace_id = cloudflare_workers_kv_namespace.app.id
  value        = var.webhook_secret
}

resource "cloudflare_workers_kv" "cd_event_types" {
  account_id   = data.cloudflare_accounts.mine.accounts[0].id
  key          = "event_types"
  namespace_id = cloudflare_workers_kv_namespace.app.id
  value        = jsonencode(var.event_types)
}

# # Create worker
# Python workers are not ready yet
# resource "cloudflare_worker_script" "app" {
#   account_id          = data.cloudflare_accounts.mine.accounts[0].id
#   content             = file("${path.module}/worker-scripts/hello.py")
#   name                = "hello-world"
#   compatibility_date  = "2024-04-01"
#   compatibility_flags = ["python_workers"]
#   kv_namespace_binding {
#     namespace_id = cloudflare_workers_kv_namespace.app.id
#     name         = "KV_NAMESPACE"
#   }
# }

# Create the queues
resource "cloudflare_queue" "cd" {
  for_each   = toset(var.event_types)
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  name       = each.value
}


data "cloudflare_zone" "deploy" {
  name = var.deploy_zone
}

resource "cloudflare_worker_script" "github" {
  account_id         = data.cloudflare_accounts.mine.accounts[0].id
  content            = file("${path.module}/worker-scripts/src/worker.js")
  name               = "github-events"
  compatibility_date = "2024-04-01"
  kv_namespace_binding {
    name         = "KV"
    namespace_id = cloudflare_workers_kv_namespace.app.id
  }

  secret_text_binding {
    name = "WEBHOOK_SECRET"
    text = var.webhook_secret
  }
  queue_binding {
    binding = "QUEUE"
    queue   = cloudflare_queue.cd["cdevents-scm"].name
  }
  module = true
}

#  Add the worker domain so that we can subscribe and push to queues
resource "cloudflare_worker_domain" "github" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  hostname   = "github.cdevents.${var.deploy_zone}"
  service    = cloudflare_worker_script.github.name
  zone_id    = data.cloudflare_zone.deploy.id
}
