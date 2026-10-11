# Social posting queue

Drafts live in `queue/*.md`. Claude (or you) writes them; **you** approve them; then they can be sent.

```
node scripts/social/post.mjs list
node scripts/social/post.mjs check linkedin-find-what-changed.md   # length + credentials
node scripts/social/post.mjs send  linkedin-find-what-changed.md   # dry run, sends nothing
node scripts/social/post.mjs send  linkedin-find-what-changed.md --yes
```

Safety rules built in:
- A post is sent only if its header says `status: approved`. Changing that line is the approval; drafts are never sent.
- `--yes` is also required. Without it, `send` is a dry run.
- A sent post is rewritten as `status: posted` with its URL and cannot be sent twice.
- Credentials come from `frontend/.env.social` (git-ignored), never from the queue files.

File format: a header (`platform: x|bluesky|mastodon|linkedin`, `status: draft|approved`), then the text. Separate thread parts with a line containing only `===`.

Supported: Bluesky, Mastodon, X, LinkedIn (single post). Not supported, on purpose: Reddit (communities ban or punish
self-promotion, post by hand), Hacker News and Product Hunt (no posting API).
Setup of each platform's token is in `.env.social.example`. Test with `node --test scripts/social/lib.test.mjs`.
