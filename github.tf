# repo and webhooks.

data "github_repositories" "integrated" {
  query = "user:brucellino topic:cdevents-enabled"
}

resource "github_repository_webhook" "cdevents" {
  lifecycle {
    precondition {
      condition     = length(data.github_repositories.integrated.names) > 0
      error_message = "No repos tagged cdevents-enabled found"
    }
  }
  for_each   = toset(data.github_repositories.integrated.names)
  events     = var.github_events
  repository = each.value

  configuration {
    url          = "https://github.cdevents.${var.deploy_zone}"
    content_type = "json"
    secret       = var.webhook_secret
    insecure_ssl = false
  }
}
