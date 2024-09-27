# Main definition

# Get Cloudflare account
data "cloudflare_accounts" "mine" {
  name = "brucellino"
}

# data "cloudflare_ip_ranges" "cf" {}

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

# Create worker
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
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  content    = file("${path.module}/worker-scripts/src/cdevent.js")
  name       = "github-events"
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

  # metadata = {
  #   logpush            = true
  #   main_module        = true
  #   placement          = "smart"
  #   compatibility_date = "2024-04-01"
  #   bindings = {
  #     name = "KV"
  #     type = "kv_namespace"
  #   }
  # }
}

# Add the worker domain so that we can subscribe and push to queues
resource "cloudflare_worker_domain" "github" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  hostname   = "github.cdevents.${var.deploy_zone}"
  service    = cloudflare_worker_script.github.name
  zone_id    = data.cloudflare_zone.deploy.id
}

resource "cloudflare_worker_script" "jira_stg" {
  account_id         = data.cloudflare_accounts.mine.accounts[0].id
  content            = file("${path.module}/worker-scripts/src/jira.js")
  name               = "jira-events-staging"
  compatibility_date = "2024-04-01"

  kv_namespace_binding {
    name         = "KV"
    namespace_id = cloudflare_workers_kv_namespace.app.id
  }

  secret_text_binding {
    name = "WEBHOOK_SECRET"
    text = var.jira_secret["staging"]
  }
  queue_binding {
    binding = "QUEUE"
    queue   = cloudflare_queue.cd["cdevents-ticket"].name
  }
  module = true

}

resource "cloudflare_worker_script" "jira_prod" {
  account_id         = data.cloudflare_accounts.mine.accounts[0].id
  content            = file("${path.module}/worker-scripts/src/jira.js")
  name               = "jira-events-prod"
  compatibility_date = "2024-04-01"

  kv_namespace_binding {
    name         = "KV"
    namespace_id = cloudflare_workers_kv_namespace.app.id
  }

  secret_text_binding {
    name = "WEBHOOK_SECRET"
    text = var.jira_secret["production"]
  }
  queue_binding {
    binding = "QUEUE"
    queue   = cloudflare_queue.cd["cdevents-ticket"].name
  }
  module = true
}

resource "cloudflare_worker_domain" "jira_stg" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  hostname   = "jira-staging.cdevents.${var.deploy_zone}"
  service    = cloudflare_worker_script.jira_stg.name
  zone_id    = data.cloudflare_zone.deploy.id
}

resource "cloudflare_worker_domain" "jira_prod" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  hostname   = "jira-prod.cdevents.${var.deploy_zone}"
  service    = cloudflare_worker_script.jira_prod.name
  zone_id    = data.cloudflare_zone.deploy.id
}

resource "cloudflare_r2_bucket" "logpush" {
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  name       = "cdevents-logs"
  location   = "WEUR"
}

# locals {
#   cf_cidrs = join(" ", data.cloudflare_ip_ranges.cf.ipv4_cidr_blocks)
# }
# resource "cloudflare_ruleset" "no_public_test_trigger" {
#   zone_id     = data.cloudflare_zone.deploy.zone_id
#   name        = "No public test trigger"
#   description = "Redirects requests to the test trigger from public sources"
#   kind        = "zone"
#   phase       = "http_request_dynamic_redirect"

#   rules {
#     action = "redirect"
#     action_parameters {
#       from_value {
#         status_code = 301
#         target_url {
#           value = "https://www.google.com"
#         }
#         preserve_query_string = false
#       }
#     }
#     expression  = "(not ip.src in {${join(" ", data.cloudflare_ip_ranges.cf.ipv4_cidr_blocks)}} and http.host eq \"start-test.eoscnode.org\")"
#     description = "Redirect requests that do not originate from cloudflare"
#     enabled     = false
#   }
# }

# moved {
#   from = cloudflare_worker_script.test
#   to   = cloudflare_workers_script.test
# }


# Start-test is the worker which sends the payload directly to the API exposing
# robot framework.
# The Cloudflare tunnel exposes this API on the url start-test.eoscnode.org
# Once the data from jira has been properly dealt with and placed on the cdevents-ticket queue
# we consume the event and pass it to the API.
# The messagee should be a JSON which contains:
# Service name (string)
# Affected Services (set(string))
# These will be passed as tag filters to the robot API.

resource "cloudflare_worker_script" "test" {
  depends_on = [cloudflare_queue.cd["cdevents-ticket"]]
  account_id = data.cloudflare_accounts.mine.accounts[0].id
  content    = file("${path.module}/worker-scripts/src/invoke-test.js")
  name       = "invoke-test"
  module     = true
  placement {
    mode = "smart"
  }
  queue_binding {
    binding = "QUEUE"
    queue   = cloudflare_queue.cd["cdevents-ticket"].name
  }
  # metadata = {
  #   main_module        = true
  #   placement_mode     = "smart"
  #   compatibility_date = "2024-09-27"
  #   bindings = [{
  #     type       = "queue"
  #     name       = "QUEUE"
  #     queue_name = cloudflare_queue.cd["cdevents-ticket"].queue_name
  #   }]
  # }
}
