# Main definition

# Get Cloudflare account
data "cloudflare_accounts" "mine" {}


# Create kv namespace
resource "cloudflare_workers_kv_namespace" "app" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  title      = "cd-app"
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
