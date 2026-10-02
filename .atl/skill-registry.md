# Skill Registry — github-service-status

Generated: 2026-10-02 (sdd-init). Scope: workspace index, not a summary.
Project skills: none. Project conventions: none (no AGENTS.md, CLAUDE.md, .cursorrules, GEMINI.md, copilot-instructions.md).
User-level skills indexed below; subagents must read the full SKILL.md source of truth at the listed path.

## Project skills

None found in: skills/, .opencode/skills/, .claude/skills/, .gemini/skills/, .cursor/skills/, .github/skills/, .codex/skills/, .qwen/skills/, .kiro/skills/, .openclaw/skills/, .pi/skills/, .agent/skills/, .agents/skills/, .atl/skills/.

## Project conventions

None found. No project standards apply; sdd-init proceeds without project conventions.

## User skills (opencode)

| Name | Trigger | Path | Scope |
| --- | --- | --- | --- |
| branch-pr | creating, opening, or preparing PRs for review | /home/jmro/.config/opencode/skills/branch-pr/SKILL.md | user |
| chained-pr | PRs over 400 lines, stacked PRs, review slices | /home/jmro/.config/opencode/skills/chained-pr/SKILL.md | user |
| cognitive-doc-design | writing guides, READMEs, RFCs, onboarding, architecture docs | /home/jmro/.config/opencode/skills/cognitive-doc-design/SKILL.md | user |
| comment-writer | PR feedback, issue replies, reviews, GitHub comments | /home/jmro/.config/opencode/skills/comment-writer/SKILL.md | user |
| gentle-ai-bench | bench, journeys, driven mode, gentle-ai-bench | /home/jmro/.config/opencode/skills/gentle-ai-bench/SKILL.md | user |
| go-testing | Go tests, go test coverage, Bubbletea teatest, golden files | /home/jmro/.config/opencode/skills/go-testing/SKILL.md | user |
| issue-creation | issue creation, bug reports, feature requests | /home/jmro/.config/opencode/skills/issue-creation/SKILL.md | user |
| judgment-day | judgment day, dual review, adversarial review | /home/jmro/.config/opencode/skills/judgment-day/SKILL.md | user |
| rdd-defect-workflow | RDD, receipt-driven development, review defects | /home/jmro/.config/opencode/skills/rdd-defect-workflow/SKILL.md | user |
| skill-creator | new skills, agent instructions | /home/jmro/.config/opencode/skills/skill-creator/SKILL.md | user |
| skill-improver | improve skills, audit skills, refactor skills | /home/jmro/.config/opencode/skills/skill-improver/SKILL.md | user |
| systemic-issue-triage | bug report triage, backlog, root cause | /home/jmro/.config/opencode/skills/systemic-issue-triage/SKILL.md | user |
| work-unit-commits | implementation, commit splitting, chained PRs | /home/jmro/.config/opencode/skills/work-unit-commits/SKILL.md | user |

Excluded per scan rules: sdd-*, _shared, skill-registry.

## User skills (agents / AWS)

| Name | Trigger | Path | Scope |
| --- | --- | --- | --- |
| amazon-bedrock | Bedrock models, RAG, agents, guardrails | /home/jmro/.agents/skills/amazon-bedrock/SKILL.md | user |
| aws-ai-ml | SageMaker fine-tuning, model selection, endpoints | /home/jmro/.agents/skills/aws-ai-ml/SKILL.md | user |
| aws-auth | Cognito auth, login, OAuth/OIDC, MFA | /home/jmro/.agents/skills/aws-auth/SKILL.md | user |
| aws-billing-and-cost-management | AWS bill, cost analysis, budgets, savings plans | /home/jmro/.agents/skills/aws-billing-and-cost-management/SKILL.md | user |
| aws-blocks | AWS Blocks full-stack apps, building blocks | /home/jmro/.agents/skills/aws-blocks/SKILL.md | user |
| aws-cdk | CDK constructs, deploy, synth, stacks | /home/jmro/.agents/skills/aws-cdk/SKILL.md | user |
| aws-cloudformation | CloudFormation templates, validation, stacks | /home/jmro/.agents/skills/aws-cloudformation/SKILL.md | user |
| aws-compute | EC2 instances, Auto Scaling, fleet ops | /home/jmro/.agents/skills/aws-compute/SKILL.md | user |
| aws-containers | EKS, ECS, Fargate, ECR containers | /home/jmro/.agents/skills/aws-containers/SKILL.md | user |
| aws-database | AWS database selection and operations | /home/jmro/.agents/skills/aws-database/SKILL.md | user |
| aws-deployment | CodePipeline, CodeBuild, CodeDeploy CI/CD | /home/jmro/.agents/skills/aws-deployment/SKILL.md | user |
| aws-iam | IAM roles, policies, trust, STS | /home/jmro/.agents/skills/aws-iam/SKILL.md | user |
| aws-messaging-and-streaming | SQS, SNS, EventBridge, Kinesis, MSK | /home/jmro/.agents/skills/aws-messaging-and-streaming/SKILL.md | user |
| aws-networking | Route 53, CloudFront, networking design | /home/jmro/.agents/skills/aws-networking/SKILL.md | user |
| aws-observability | CloudWatch, X-Ray, alarms, dashboards | /home/jmro/.agents/skills/aws-observability/SKILL.md | user |
| aws-sdk-js-v3-usage | AWS SDK for JavaScript v3 code | /home/jmro/.agents/skills/aws-sdk-js-v3-usage/SKILL.md | user |
| aws-sdk-python-usage | boto3/botocore Python code | /home/jmro/.agents/skills/aws-sdk-python-usage/SKILL.md | user |
| aws-sdk-swift-usage | AWS SDK for Swift code | /home/jmro/.agents/skills/aws-sdk-swift-usage/SKILL.md | user |
| aws-security | Security Hub, GuardDuty, security posture | /home/jmro/.agents/skills/aws-security/SKILL.md | user |
| aws-serverless | Lambda, API Gateway, Step Functions, SAM | /home/jmro/.agents/skills/aws-serverless/SKILL.md | user |
| aws-storage | S3/EBS/EFS storage selection and costs | /home/jmro/.agents/skills/aws-storage/SKILL.md | user |
| launch-with-aws | migrate vibe-coded app to AWS | /home/jmro/.agents/skills/launch-with-aws/SKILL.md | user |
| signing-in-to-aws | AWS credentials, aws login, auth setup | /home/jmro/.agents/skills/signing-in-to-aws/SKILL.md | user |

Note: ~/.pi/agent/skills/ mirrors the AWS set; deduplicated by skill name, preferring project-level (none exist).
