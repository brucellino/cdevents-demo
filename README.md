[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit) [![pre-commit.ci status](https://results.pre-commit.ci/badge/github/brucellino/cdevents-demo/main.svg)](https://results.pre-commit.ci/latest/github/brucellino/cdevents-demo/main) [![semantic-release: conventional](https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

# Continuous Delivery Events

This repository provides the Terraform for creating the services to implement [Continuous Delivery Events](https://cdevents.dev) using the Cloudflare developer platform.

Events from external sources (Jira, Github) are received via their respective webhook payloads by [Cloudflare workers](https://developers.cloudflare.com/workers/).

These workers consume the payload and transform it into a message placed on a [Cloudflare workers queue](https://developers.cloudflare.com/queues/).

Other workers consume these messages and delivery them to other services which may be hosted on prem, connected via [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

## Example - Jira Ticket transition

Consider the scenario:

> A jira ticket transitions to the state "testing in staging". This should trigger the execution of the tests of the relevant service, and report the status back to the ticket.

In this case a Jira payload is POSTed to a worker, which validates the payload, and converts the payload into a scoped message .
The message is then placed on a queue, for any subscriber to consume.

The subscriber in this case is the worker which will consume the message and POST it to the QA API.


## Example - Deployment Event

Consider the scenario:

> A deployment event in Github should update a ticket in Jira to transition it to the "deploying in staging" state.


## How to use

<!-- todo -->

## Examples

The `examples/` directory contains the example usage of this module.
These examples show how to use the module in your project, and are also use for testing in CI/CD.


<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >1.8.0 |
| <a name="requirement_cloudflare"></a> [cloudflare](#requirement\_cloudflare) | 4.43.0 |
| <a name="requirement_github"></a> [github](#requirement\_github) | ~> 6.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_cloudflare"></a> [cloudflare](#provider\_cloudflare) | 4.42.0 |
| <a name="provider_github"></a> [github](#provider\_github) | 6.3.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [cloudflare_api_token.logpush_r2_token](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/api_token) | resource |
| [cloudflare_queue.cd](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/queue) | resource |
| [cloudflare_r2_bucket.logpush](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/r2_bucket) | resource |
| [cloudflare_workers_domain.github](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_domain) | resource |
| [cloudflare_workers_domain.jira_prod](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_domain) | resource |
| [cloudflare_workers_domain.jira_stg](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_domain) | resource |
| [cloudflare_workers_kv.cd_event_types](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_kv) | resource |
| [cloudflare_workers_kv.services](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_kv) | resource |
| [cloudflare_workers_kv.webhook_secret](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_kv) | resource |
| [cloudflare_workers_kv_namespace.app](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_kv_namespace) | resource |
| [cloudflare_workers_script.github](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_script) | resource |
| [cloudflare_workers_script.invoke-test](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_script) | resource |
| [cloudflare_workers_script.jira_prod](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_script) | resource |
| [cloudflare_workers_script.jira_stg](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/resources/workers_script) | resource |
| [github_repository_webhook.cdevents](https://registry.terraform.io/providers/integrations/github/latest/docs/resources/repository_webhook) | resource |
| [cloudflare_accounts.mine](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/data-sources/accounts) | data source |
| [cloudflare_api_token_permission_groups.all](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/data-sources/api_token_permission_groups) | data source |
| [cloudflare_zone.deploy](https://registry.terraform.io/providers/cloudflare/cloudflare/4.43.0/docs/data-sources/zone) | data source |
| [github_repositories.integrated](https://registry.terraform.io/providers/integrations/github/latest/docs/data-sources/repositories) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_deploy_zone"></a> [deploy\_zone](#input\_deploy\_zone) | The zone we will be deploying resources and pages into. | `string` | `"brucellino.dev"` | no |
| <a name="input_event_types"></a> [event\_types](#input\_event\_types) | List of types of events. See https://cdevents.dev/docs/ | `list(string)` | <pre>[<br/>  "cdevents-core",<br/>  "cdevents-scm",<br/>  "cdevents-ci",<br/>  "cdevents-test",<br/>  "cdevents-cd",<br/>  "cdevents-ops",<br/>  "cdevents-ticket"<br/>]</pre> | no |
| <a name="input_github_events"></a> [github\_events](#input\_github\_events) | List of Github events we will be listening to for. | `list(string)` | <pre>[<br/>  "check_run",<br/>  "issue_comment",<br/>  "issues",<br/>  "label",<br/>  "pull_request",<br/>  "pull_request_review",<br/>  "push",<br/>  "registry_package",<br/>  "release",<br/>  "workflow_job",<br/>  "workflow_run"<br/>]</pre> | no |
| <a name="input_jira_secret"></a> [jira\_secret](#input\_jira\_secret) | Secret used to sign Jira webhook deliveries per environment | `map(string)` | <pre>{<br/>  "production": "secret",<br/>  "staging": "secret"<br/>}</pre> | no |
| <a name="input_jira_secret_staging"></a> [jira\_secret\_staging](#input\_jira\_secret\_staging) | Secret used to sign Jira webhook deliveries for staging events | `string` | `"secret"` | no |
| <a name="input_services"></a> [services](#input\_services) | Set of service names as they are defined in the ticketing system and CMDB | `set(string)` | <pre>[<br/>  "Lot 0 - test service"<br/>]</pre> | no |
| <a name="input_webhook_secret"></a> [webhook\_secret](#input\_webhook\_secret) | Secret used to sign github webhook deliveries | `string` | `"secret"` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
