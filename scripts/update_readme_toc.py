#!/usr/bin/env python3
"""Update the article list in README.md from repository issues."""

from __future__ import annotations

import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

OWNER = "mechatsvip"
REPO = "mechatsvip.github.io"
API_URL = f"https://api.github.com/repos/{OWNER}/{REPO}/issues"
README_PATH = "README.md"
START = "<!-- articles:start -->"
END = "<!-- articles:end -->"


def fetch_articles(token: str) -> list[dict[str, object]]:
    articles: list[dict[str, object]] = []
    page = 1
    while True:
        request = Request(
            f"{API_URL}?state=all&per_page=100&page={page}",
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "mechatsvip-readme-article-index",
            },
        )
        try:
            with urlopen(request, timeout=30) as response:
                issues = json.load(response)
        except (HTTPError, URLError, TimeoutError) as error:
            raise RuntimeError(f"Could not fetch repository issues: {error}") from error

        if not isinstance(issues, list):
            raise RuntimeError("GitHub API returned an unexpected response for issues.")

        for issue in issues:
            # GitHub's issues API also returns pull requests; omit those, but include issues from every author.
            if "pull_request" in issue:
                continue
            articles.append(issue)

        if len(issues) < 100:
            break
        page += 1

    return sorted(articles, key=lambda issue: issue["number"], reverse=True)


def escape_markdown_title(title: str) -> str:
    return re.sub(r"([\\\[\]])", r"\\\1", title)


def update_readme(articles: list[dict[str, object]]) -> bool:
    with open(README_PATH, encoding="utf-8") as readme_file:
        readme = readme_file.read()

    section = re.search(r"(?m)^## 文章目录\s*$", readme)
    if not section:
        raise RuntimeError("README.md is missing the '## 文章目录' heading.")

    content_start = section.end()
    next_heading = re.search(r"(?m)^##? ", readme[content_start:])
    content_end = content_start + next_heading.start() if next_heading else len(readme)

    entries = [START]
    entries.extend(
        f"- [{escape_markdown_title(str(article['title']))}]({article['html_url']})"
        for article in articles
    )
    entries.append(END)
    new_section = "\n\n" + "\n".join(entries) + "\n"
    updated = readme[:content_start] + new_section + readme[content_end:]

    if updated == readme:
        print("README article directory is already up to date.")
        return False

    with open(README_PATH, "w", encoding="utf-8", newline="\n") as readme_file:
        readme_file.write(updated)
    print(f"Updated README article directory with {len(articles)} articles.")
    return True


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is required.")
    update_readme(fetch_articles(token))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"README update failed: {error}", file=sys.stderr)
        raise
