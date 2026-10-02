#!/usr/bin/env python3
"""
GitHub Service Status Generator
Fetches issues, PRs, branches, and commits across configured user and org repositories using gh CLI.
Outputs materialized status.json for the static SPA.
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

def run(*args):
    """Executes a subprocess command and parses JSON output if possible."""
    p = subprocess.run(args, capture_output=True, text=True)
    if p.returncode != 0:
        return None
    out = p.stdout.strip()
    if not out:
        return None
    try:
        return json.loads(out)
    except Exception:
        return {"raw": out}

def discover_repositories(test_slice_only=False):
    """Discovers repository names for configured users and orgs."""
    if test_slice_only and "testSlice" in TARGETS:
        return TARGETS["testSlice"]

    repos = set()
    
    # 1. Discover user repos
    for user in TARGETS.get("users", []):
        data = run("gh", "repo", "list", user, "--limit", "100", "--json", "nameWithOwner,isArchived")
        if isinstance(data, list):
            for r in data:
                if EXCLUDE_ARCHIVED and r.get("isArchived"):
                    continue
                repos.add(r["nameWithOwner"])

    # 2. Discover org repos
    for org in TARGETS.get("orgs", []):
        data = run("gh", "repo", "list", org, "--limit", "100", "--json", "nameWithOwner,isArchived")
        if isinstance(data, list):
            for r in data:
                if EXCLUDE_ARCHIVED and r.get("isArchived"):
                    continue
                repos.add(r["nameWithOwner"])

    return sorted(list(repos))

def repo_snapshot(repo):
    """Fetches details for a single repository."""
    issues = run("gh", "issue", "list", "--repo", repo, "--limit", str(LIMITS.get("issues", 10)),
                 "--json", "number,title,url,state") or []
    
    prs = run("gh", "pr", "list", "--repo", repo, "--limit", str(LIMITS.get("prs", 10)),
               "--json", "number,title,url,state") or []
    
    branches = run("gh", "api", f"repos/{repo}/branches", "--paginate", "--jq",
                    f"[.[0:{LIMITS.get('branches', 30)}][] | {{name: .name, url: \"https://github.com/{repo}/tree/\" + .name}}]") or []
    
    commits = run("gh", "api", f"repos/{repo}/commits", "--paginate", "--jq",
                   f"[.[0:{LIMITS.get('commits', 5)}][] | {{sha: .sha[0:7], msg: (.commit.message | split(\"\\n\")[0]), html_url: .html_url}}]") or []
    
    return {
        "repo": repo,
        "url": f"https://github.com/{repo}",
        "issues": issues,
        "prs": prs,
        "branches": branches,
        "commits": commits
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
