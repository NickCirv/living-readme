# living-readme — research record

## Revision and scope

- Repository: [NickCirv/living-readme](https://github.com/NickCirv/living-readme)
- Commit: `ebab91cb89078656330530e5a10493f2f41068eb`
- Tree: `063efda0574abb4e16dc8990e4763c2e640137ef`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/package.json) | verified in manifest; installation unverified |
| Draft README changes from a Git diff through an Anthropic request. | [implementation](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/package.json) | verified as a declaration only |

## Findings carried into the rewrite

The model receives README/diff content and can change more than intended. Section preservation is a prompt request, not a verified guarantee. Installation and removal alter hooks; update edits and stages documentation.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/LICENSE) · blob `05b804beeec7d1a6c933d087387ba4adf6463d93`.
- [README.md](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/README.md) · blob `1bf9e6fb92a2be600aa085b5c1a3da3beff6885e`.
- [package.json](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/package.json) · blob `11e1ba11006b1f2ccc5bf3e74d510e5e6b1cafda`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/index.js) · blob `c54e50a69a51d731841b9707c9c9000b6aaf5c82`.
- [test/smoke.test.js](https://github.com/NickCirv/living-readme/blob/ebab91cb89078656330530e5a10493f2f41068eb/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `.gitignore`
- `.living-readme`
