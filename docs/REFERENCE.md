# living-readme — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `ebab91cb89078656330530e5a10493f2f41068eb`. Commands are source-inspected; no execution results are asserted.

## Workflow

Installs a post-commit hook or runs update manually, maps changed files to README sections, sends context to the model, writes the returned README and stages it. Supports a timestamp loop guard and .living-readme configuration.

Requires Git and ANTHROPIC_API_KEY for generation. Review all generated diffs before committing; this review did not call the provider.

```bash
node index.js status
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `status` | Inspect hook/key configuration |
| `install / uninstall` | Change the post-commit hook |
| `update` | Generate and stage README changes |
| `--message TEXT` | Add prompt context |
| `--force` | Bypass the timestamp guard |

## Interpretation and side effects

The model receives README/diff content and can change more than intended. Section preservation is a prompt request, not a verified guarantee. Installation and removal alter hooks; update edits and stages documentation.

## Implementation reference

- [package.json](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/package.json)
- [index.js](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/test/smoke.test.js)
