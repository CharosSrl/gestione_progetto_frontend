# Project — gestione_progetto (frontend)

Angular frontend. Repo: https://github.com/CharosSrl/gestione_progetto_frontend

## Skills (auto-loaded every session)

This project keeps reusable skills in `skills/`. Each skill is a `.skill` bundle
(a zip) plus its extracted, plain-text form. The extracted `SKILL.md` files are
imported below so their guidance is in context from the start of every session.

When working in this project, follow the conventions defined by these skills.
Read a skill's `references/*.md` files only when the skill tells you to.

@skills/angular-project/SKILL.md

<!--
HOW TO ADD A NEW SKILL
1. Drop the bundle in skills/  (e.g. skills/my-skill.skill)
2. Extract it:  cd skills && unzip -o my-skill.skill -d .
3. Add an import line above:  @skills/my-skill/SKILL.md
The extracted SKILL.md is what gets loaded; keep the .skill bundle as the source.
-->

## API

The backend contract lives in `openapi.yaml` at the project root — consult it for
endpoint shapes, auth, and DTOs before wiring up services.
