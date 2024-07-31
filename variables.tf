# variables.tf
variable "event_types" {
  type        = list(string)
  description = "List of types of events. See https://cdevents.dev/docs/"
  default     = ["core", "scm", "ci", "test", "cd", "ops", "ticket"]

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
  description = "Secret used to sign webhook deliveries"
}
