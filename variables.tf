# variables.tf
variable "event_types" {
  type        = list(string)
  description = "List of types of events. See https://cdevents.dev/docs/"
  default     = ["cdevents-core", "cdevents-scm", "cdevents-ci", "cdevents-test", "cdevents-cd", "cdevents-ops", "cdevents-ticket"]

  validation {
    # must match ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$
    condition     = alltrue([for q in var.event_types : length(regexall("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$", q)) > 0])
    error_message = "Queue name must be lower-case with numbers and dash only."
  }
}

variable "deploy_zone" {
  type        = string
  default     = "brucellino.dev"
  description = "The zone we will be deploying resources and pages into."
}

variable "webhook_secret" {
  type        = string
  sensitive   = true
  default     = "secret"
  description = "Secret used to sign github webhook deliveries"
}
variable "jira_secret_staging" {
  type        = string
  sensitive   = true
  default     = "secret"
  description = "Secret used to sign Jira webhook deliveries for staging events"
}

variable "jira_secret" {
  type      = map(string)
  sensitive = true
  default = {
    staging    = "secret"
    production = "secret"
  }
  description = "Secret used to sign Jira webhook deliveries per environment"
}

variable "github_events" {
  type        = list(string)
  description = "List of Github events we will be listening to for."
  default     = ["check_run", "issue_comment", "issues", "label", "pull_request", "pull_request_review", "push", "registry_package", "release", "workflow_job", "workflow_run"]
}
