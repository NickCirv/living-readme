![living-readme — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# living-readme

Draft README changes from a Git diff through an Anthropic request.


<a id="usage"></a>

## What it does

Installs a post-commit hook or runs update manually, maps changed files to README sections, sends context to the model, writes the returned README and stages it. Supports a timestamp loop guard and .living-readme configuration. See the pinned [implementation](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/index.js).



<a id="install"></a>

<a id="configuration"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Requires Git and ANTHROPIC_API_KEY for generation. Review all generated diffs before committing; this review did not call the provider.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/living-readme.git
cd living-readme
git checkout ebab91cb89078656330530e5a10493f2f41068eb
npm install --ignore-scripts
node index.js status
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`living-readme` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `status` | Inspect hook/key configuration |
| `install / uninstall` | Change the post-commit hook |
| `update` | Generate and stage README changes |
| `--message TEXT` | Add prompt context |
| `--force` | Bypass the timestamp guard |

## Limits and operational notes

The model receives README/diff content and can change more than intended. Section preservation is a prompt request, not a verified guarantee. Installation and removal alter hooks; update edits and stages documentation.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
