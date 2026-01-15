#!/usr/bin/env python3
"""
Gitingest wrapper script for code review feature.
Converts a GitHub repository into a text digest for LLM analysis.

Usage: python gitingest_wrapper.py <github_repo_url>
Output: JSON with summary, tree structure, and content
"""

import sys
import json

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "No repository URL provided"
        }))
        sys.exit(1)

    repo_url = sys.argv[1]

    try:
        from gitingest import ingest

        # Ingest the repository
        summary, tree, content = ingest(repo_url)

        # Limit content size to avoid token limits (50KB max)
        max_content_size = 50000
        if len(content) > max_content_size:
            content = content[:max_content_size] + "\n\n... [Content truncated for size]"

        result = {
            "success": True,
            "summary": summary or "",
            "tree": tree or "",
            "content": content or ""
        }

        print(json.dumps(result))

    except ImportError:
        print(json.dumps({
            "success": False,
            "error": "gitingest package not installed. Run: pip install gitingest"
        }))
        sys.exit(1)

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
