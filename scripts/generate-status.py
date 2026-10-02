#!/usr/bin/env python3
"""
GitHub Service Status Generator
Fetches ALL issues, PRs (open/closed/merged), branches (with merge status, ahead_by count, branch author),
and PR commits/comments across configured user and org repositories using gh CLI.
Outputs materialized status.json with complete history and graphical metrics.
"""
import sys
import json
import subprocess
import datetime
import pathlib
import argparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS_FILE = ROOT / "targets.json"

if not TARGETS_FILE.exists():
    print(f"Error: {TARGETS_FILE} not found.", file=sys.stderr)
    sys.exit(1)

TARGETS = json.loads(TARGETS_FILE.read_text())
LIMITS = TARGETS.get("limits", {})
EXCLUDE_ARCHIVED = TARGETS.get("excludeArchived", True)

def run_json(*args):
    """Executes a subprocess command and parses JSON output cleanly."""
    p = subprocess.run(args, capture_output=True, text=True)
    if p.returncode != 0:
        return None
    out = p.stdout.strip()
    if not out:
        return None
    try:
        data = json.loads(out)
        if isinstance(data, dict) and "raw" in data:
            return None
        return data
    except Exception:
        return None

def get_default_branch(repo):
    """Retrieves default branch name for repository."""
    data = run_json("gh", "repo", "view", repo, "--json", "defaultBranchRef")
    if isinstance(data, dict) and data.get("defaultBranchRef"):
        return data["defaultBranchRef"].get("name", "main")
    return "main"

def discover_repositories(test_slice_only=False):
    """Discovers repository names for configured users and orgs."""
    if test_slice_only and "testSlice" in TARGETS:
        return TARGETS["testSlice"]

    repos = set()
    
    # 1. Discover user repos
    for user in TARGETS.get("users", []):
        data = run_json("gh", "repo", "list", user, "--limit", "100", "--json", "nameWithOwner,isArchived")
        if isinstance(data, list):
            for r in data:
                if EXCLUDE_ARCHIVED and r.get("isArchived"):
                    continue
                repos.add(r["nameWithOwner"])

    # 2. Discover org repos
    for org in TARGETS.get("orgs", []):
        data = run_json("gh", "repo", "list", org, "--limit", "100", "--json", "nameWithOwner,isArchived")
        if isinstance(data, list):
            for r in data:
                if EXCLUDE_ARCHIVED and r.get("isArchived"):
                    continue
                repos.add(r["nameWithOwner"])

    return sorted(list(repos))

def fetch_branch_commits(repo, branch_name, is_incorporated):
    """Fetches latest commits for a specific branch sorted newest first."""
    commit_limit = LIMITS.get("commits", 50)
    raw_commits = run_json("gh", "api", f"repos/{repo}/commits?sha={branch_name}&per_page={commit_limit}", "--jq",
                            f"[.[0:{commit_limit}][] | {{sha: .sha[0:7], msg: (.commit.message | split(\"\\n\")[0]), author: (.author.login // .commit.author.name), date: .commit.author.date, html_url: .html_url}}]") or []
    
    commits = []
    if isinstance(raw_commits, list):
        for c in raw_commits:
            c["is_incorporated"] = is_incorporated
            commits.append(c)
    return commits

def repo_snapshot(repo):
    """Fetches full history details and calculates graphical metrics for a single repository."""
    default_branch = get_default_branch(repo)

    # Issues: ALL states (OPEN / CLOSED)
    issues = run_json("gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", str(LIMITS.get("issues", 100)),
                      "--json", "number,title,url,state,createdAt") or []
    
    # PRs: ALL states (OPEN / CLOSED / MERGED)
    prs = run_json("gh", "pr", "list", "--repo", repo, "--state", "all", "--limit", str(LIMITS.get("prs", 100)),
                    "--json", "number,title,url,state,createdAt") or []
    
    branch_limit = LIMITS.get("branches", 50)
    raw_branches = run_json("gh", "api", f"repos/{repo}/branches?per_page={branch_limit}", "--jq",
                            f"[.[0:{branch_limit}][] | {{name: .name, url: \"https://github.com/{repo}/tree/\" + .name}}]") or []
    
    if not isinstance(raw_branches, list):
        raw_branches = []

    branches = []
    merged_branches_count = 0
    pending_branches_count = 0

    for b in raw_branches:
        b_name = b.get("name")
        if not b_name:
            continue

        is_default = (b_name == default_branch)
        is_merged = is_default
        ahead_by = 0

        if not is_default:
            compare_data = run_json("gh", "api", f"repos/{repo}/compare/{default_branch}...{b_name}")
            if isinstance(compare_data, dict):
                ahead_by = compare_data.get("ahead_by", 0)
                is_merged = (ahead_by == 0)

        if is_merged:
            merged_branches_count += 1
        else:
            pending_branches_count += 1

        b_commits = fetch_branch_commits(repo, b_name, is_incorporated=is_merged)
        b_author = b_commits[0].get("author") if (b_commits and len(b_commits) > 0) else None

        branches.append({
            "name": b_name,
            "author": b_author,
            "url": b.get("url"),
            "is_default": is_default,
            "is_merged": is_merged,
            "ahead_by": ahead_by,
            "commits": b_commits
        })

    default_commits = branches[0]["commits"] if branches else []
    
    comment_limit = LIMITS.get("comments", 100)
    comments = run_json("gh", "api", f"repos/{repo}/pulls/comments?per_page={comment_limit}", "--jq",
                         f"[.[0:{comment_limit}][] | {{user: .user.login, body: (.body | split(\"\\n\")[0]), html_url: .html_url, created_at: .created_at}}]") or []

    if not isinstance(issues, list): issues = []
    if not isinstance(prs, list): prs = []
    if not isinstance(comments, list): comments = []

    # Sort comments newest first
    comments.sort(key=lambda c: c.get("created_at", ""), reverse=True)

    # Compute metrics for visual graphics
    open_prs = sum(1 for p in prs if String(p.get("state")).upper() == "OPEN") if prs else 0
    merged_prs = sum(1 for p in prs if String(p.get("state")).upper() == "MERGED") if prs else 0
    closed_prs = sum(1 for p in prs if String(p.get("state")).upper() == "CLOSED") if prs else 0

    open_issues = sum(1 for i in issues if String(i.get("state")).upper() == "OPEN") if issues else 0
    closed_issues = sum(1 for i in issues if String(i.get("state")).upper() == "CLOSED") if issues else 0

    metrics = {
        "prs": {"total": len(prs), "open": open_prs, "merged": merged_prs, "closed": closed_prs},
        "issues": {"total": len(issues), "open": open_issues, "closed": closed_issues},
        "branches": {"total": len(branches), "merged": merged_branches_count, "pending": pending_branches_count},
        "comments": {"total": len(comments)}
    }

    return {
        "repo": repo,
        "default_branch": default_branch,
        "url": f"https://github.com/{repo}",
        "metrics": metrics,
        "issues": issues,
        "prs": prs,
        "branches": branches,
        "commits": default_commits,
        "comments": comments
    }

def String(val):
    return str(val) if val is not None else ""

def main():
    parser = argparse.ArgumentParser(description="Generate status.json for GitHub Service Status")
    parser.add_argument("--test-slice", action="store_true", help="Only run for test slice repositories")
    args = parser.parse_args()

    repo_list = discover_repositories(test_slice_only=args.test_slice)
    print(f"Generating status for {len(repo_list)} repositories...")

    repo_data = []
    for r in repo_list:
        try:
            repo_data.append(repo_snapshot(r))
        except Exception as e:
            print(f"Error processing {r}: {e}", file=sys.stderr)

    status = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "mode": "test-slice" if args.test_slice else "full-scan",
        "total_repos": len(repo_data),
        "repos": repo_data
    }

    out = ROOT / "status.json"
    out.write_text(json.dumps(status, indent=2, ensure_ascii=False))
    print(f"Successfully wrote {out} with {len(repo_data)} repos.")

if __name__ == "__main__":
    main()
