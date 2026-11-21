#!/usr/bin/env python3
"""Publish a daily digest of AI-related stories from public RSS feeds."""

from __future__ import annotations

import html
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

import feedparser

OWNER = "mechatxx"
REPO = "mechatxx.github.io"
API_ROOT = f"https://api.github.com/repos/{OWNER}/{REPO}"
FEEDS = (
    ("Google News · AI", "https://news.google.com/rss/search?q=artificial+intelligence+OR+AI&hl=en-US&gl=US&ceid=US:en"),
    ("arXiv · Artificial Intelligence", "https://export.arxiv.org/rss/cs.AI"),
    ("arXiv · Machine Learning", "https://export.arxiv.org/rss/cs.LG"),
)
MAX_ITEMS = 12
BEIJING = ZoneInfo("Asia/Shanghai")


def github_request(path: str, token: str, method: str = "GET", payload: dict | None = None):
    data = None if payload is None else __import__("json").dumps(payload).encode("utf-8")
    request = Request(
        f"{API_ROOT}{path}",
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "mechatsvip-daily-ai-digest",
            **({"Content-Type": "application/json"} if data is not None else {}),
        },
    )
    with urlopen(request, timeout=30) as response:
        return __import__("json").load(response)


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def entry_date(entry) -> datetime | None:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        return datetime(*parsed[:6], tzinfo=timezone.utc)
    raw = entry.get("published") or entry.get("updated")
    if raw:
        try:
            date = parsedate_to_datetime(raw)
            return date.replace(tzinfo=timezone.utc) if date.tzinfo is None else date
        except (TypeError, ValueError, OverflowError):
            return None
    return None


def collect_items(now_utc: datetime) -> list[dict[str, str]]:
    cutoff = now_utc - timedelta(hours=36)
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for source, feed_url in FEEDS:
        try:
            feed = feedparser.parse(feed_url, request_headers={"User-Agent": "mechatsvip-daily-ai-digest/1.0"})
            if feed.bozo and not feed.entries:
                print(f"Warning: could not read {source}: {feed.bozo_exception}", file=sys.stderr)
                continue
            for entry in feed.entries:
                link = (entry.get("link") or "").strip()
                if not link.startswith(("https://", "http://")) or link in seen:
                    continue
                published = entry_date(entry)
                if published and published < cutoff:
                    continue
                title = clean_text(entry.get("title", ""))
                if not title:
                    continue
                summary = clean_text(entry.get("summary", ""))
                if len(summary) > 400:
                    summary = summary[:397].rstrip() + "…"
                seen.add(link)
                items.append({
                    "title": title,
                    "link": link,
                    "summary": summary,
                    "source": source,
                    "published": published.astimezone(BEIJING).strftime("%Y-%m-%d %H:%M") if published else "日期未提供",
                    "sort_key": published.isoformat() if published else "",
                })
        except (HTTPError, URLError, TimeoutError, ValueError) as error:
            print(f"Warning: could not fetch {source}: {error}", file=sys.stderr)

    items.sort(key=lambda item: item["sort_key"], reverse=True)
    return items[:MAX_ITEMS]


def markdown_escape(text: str) -> str:
    return re.sub(r"([\\`*_{}\[\]()#+.!|>~-])", r"\\\1", text)


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is required (provide the Actions GITHUB_TOKEN secret).")

    now = datetime.now(BEIJING)
    marker = f"AI-DIGEST-{now:%Y-%m-%d}"
    existing = github_request("/issues?state=all&per_page=100&sort=created&direction=desc", token)
    if any(marker in (issue.get("body") or "") for issue in existing if "pull_request" not in issue):
        print(f"Digest {marker} already exists; skipping duplicate.")
        return

    items = collect_items(datetime.now(timezone.utc))
    if not items:
        raise RuntimeError("No recent AI stories could be fetched; refusing to publish an empty digest.")

    lines = [
        f"<!-- {marker} -->",
        f"# AI 新闻每日摘要 · {now:%Y-%m-%d}",
        "",
        "> 自动汇总自公开 RSS 来源；标题、摘要和原文链接归原发布方所有。",
        "",
    ]
    for index, item in enumerate(items, start=1):
        lines.extend([
            f"## {index}. [{markdown_escape(item['title'])}](<{item['link']}>)",
            f"**来源：** {item['source']} · **发布时间（北京时间）：** {item['published']}",
        ])
        if item["summary"]:
            lines.append("")
            lines.append(item["summary"])
        lines.append("")
    lines.extend(["---", "本摘要由 GitHub Actions 定时生成。", ""])

    issue = github_request(
        "/issues",
        token,
        method="POST",
        payload={"title": f"AI 新闻每日摘要 · {now:%Y-%m-%d}", "body": "\n".join(lines)},
    )
    print(f"Published digest issue #{issue['number']}: {issue['html_url']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Daily AI digest failed: {error}", file=sys.stderr)
        raise
