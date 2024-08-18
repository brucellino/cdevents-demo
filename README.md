[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit) [![pre-commit.ci status](https://results.pre-commit.ci/badge/github/brucellino/cdevents-demo/main.svg)](https://results.pre-commit.ci/latest/github/brucellino/cdevents-demo/main) [![semantic-release: conventional](https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

# CD Events Demo

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
| <a name="requirement_cloudflare"></a> [cloudflare](#requirement\_cloudflare) | ~> 4.0 |
| <a name="requirement_github"></a> [github](#requirement\_github) | ~> 6.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_cloudflare"></a> [cloudflare](#provider\_cloudflare) | 4.38.0 |
| <a name="provider_github"></a> [github](#provider\_github) | 6.2.3 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [cloudflare_queue.cd](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/queue) | resource |
| [cloudflare_workers_kv.cd_event_types](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/workers_kv) | resource |
| [cloudflare_workers_kv.webhook_secret](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/workers_kv) | resource |
| [cloudflare_workers_kv_namespace.app](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/workers_kv_namespace) | resource |
| [github_repository_webhook.cdevents](https://registry.terraform.io/providers/integrations/github/latest/docs/resources/repository_webhook) | resource |
| [cloudflare_accounts.mine](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/data-sources/accounts) | data source |
| [cloudflare_zones.deploy](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/data-sources/zones) | data source |
| [github_repositories.integrated](https://registry.terraform.io/providers/integrations/github/latest/docs/data-sources/repositories) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_deploy_zone"></a> [deploy\_zone](#input\_deploy\_zone) | The zone we will be deploying resources and pages into. | `string` | `"brucellino.dev"` | no |
| <a name="input_event_types"></a> [event\_types](#input\_event\_types) | List of types of events. See https://cdevents.dev/docs/ | `list(string)` | <pre>[<br>  "cdevents-core",<br>  "cdevents-scm",<br>  "cdevents-ci",<br>  "cdevents-test",<br>  "cdevents-cd",<br>  "cdevents-ops",<br>  "cdevents-ticket"<br>]</pre> | no |
| <a name="input_github_events"></a> [github\_events](#input\_github\_events) | List of Github events we will be listening to for. | `list(string)` | <pre>[<br>  "check_run",<br>  "issue_comment",<br>  "issues",<br>  "label",<br>  "pull_request",<br>  "pull_request_review",<br>  "push",<br>  "registry_package",<br>  "release",<br>  "workflow_job",<br>  "workflow_run"<br>]</pre> | no |
| <a name="input_webhook_secret"></a> [webhook\_secret](#input\_webhook\_secret) | Secret used to sign webhook deliveries | `string` | `"secret"` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
