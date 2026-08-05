# Sirve la Mesa

## Flujo de trabajo

- Una rama por tarea. Los PRs pueden apuntar a `develop` o directamente a `main`.
- `main` no tiene protección técnica (repo privado en plan free): la regla es disciplina de equipo — nada se commitea directo a `main`, todo entra por PR.
- **Ningún PR se mergea sin la aprobación explícita de Daniel (DanCas03).** Los agentes preparan el PR, lo dejan abierto y se detienen ahí.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`ACifuentesH/Sirve-lamesa`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles use their default names as labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
