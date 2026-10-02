#!/usr/bin/env python3
"""
GitHub Service Status Generator
Fetches ALL issues, PRs (open/closed/merged), branches (with per-branch commits and author),
and PR comments across configured user and org repositories using gh CLI.
Outputs materialized status.json ordered newest-first.
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

def fetch_branch_commits(repo, branch_name):
    """Fetches latest commits for a specific branch sorted newest first."""
    commit_limit = LIMITS.get("commits", 30)
    commits = run_json("gh", "api", f"repos/{repo}/commits?sha={branch_name}&per_page={commit_limit}", "--jq",
                        f"[.[0:{commit_limit}][] | {{sha: .sha[0:7], msg: (.commit.message | split(\"\\n\")[0]), author: (.author.login // .commit.author.name), date: .commit.author.date, html_url: .html_url}}]") or []
    return commits if isinstance(commits, list) else []

def repo_snapshot(repo):
    """Fetches details for a single repository, capturing both open and closed states."""
    # Issues: ALL states (OPEN / CLOSED)
    issues = run_json("gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", str(LIMITS.get("issues", 50)),
                      "--json", "number,title,url,state,createdAt") or []
    
    # PRs: ALL states (OPEN / CLOSED / MERGED)
    prs = run_json("gh", "pr", "list", "--repo", repo, "--state", "all", "--limit", str(LIMITS.get("prs", 50)),
                    "--json", "number,title,url,state,createdAt") or []
    
    branch_limit = LIMITS.get("branches", 50)
    raw_branches = run_json("gh", "api", f"repos/{repo}/branches?per_page={branch_limit}", "--jq",
                            f"[.[0:{branch_limit}][] | {{name: .name, url: \"https://github.com/{repo}/tree/\" + .name}}]") or []
    
    if not isinstance(raw_branches, list):
        raw_branches = []

    branches = []
    for b in raw_branches:
        b_name = b.get("name")
        b_commits = fetch_branch_commits(repo, b_name) if b_name else []
        b_author = b_commits[0].get("author") if (b_commits and len(b_commits) > 0) else None
        branches.append({
            "name": b_name,
            "author": b_author,
            "url": b.get("url"),
            "commits": b_commits
        })

    default_commits = branches[0]["commits"] if branches else []
    
    comment_limit = LIMITS.get("comments", 50)
    comments = run_json("gh", "api", f"repos/{repo}/pulls/comments?per_page={comment_limit}", "--jq",
                         f"[.[0:{comment_limit}][] | {{user: .user.login, body: (.body | split(\"\\n\")[0]), html_url: .html_url, created_at: .created_at}}]") or []

    if not isinstance(issues, list): issues = []
    if not isinstance(prs, list): prs = []
    if not isinstance(comments, list): comments = []

    # Sort comments newest first
    comments.sort(key=lambda c: c.get("created_at", ""), reverse=True)

    return {
        "repo": repo,
        "url": f"https://github.com/{repo}",
        "issues": issues,
        "prs": prs,
        "branches": branches,
        "commits": default_commits,
        "comments": comments
    }

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
