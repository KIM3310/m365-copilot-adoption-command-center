# System Alignment Matrix

This matrix maps the AI assistant adoption operating model to concrete implementation evidence in the project. It is written as a technical review surface, not as a personnel or organization-specific claim.

## Capability Alignment

| Capability area | Project evidence | Boundary note |
| --- | --- | --- |
| Enterprise operating model | [capability_fit.md](capability_fit.md), [walkthrough_storyline.md](walkthrough_storyline.md), dashboard capability-fit section | Shows the structure and decision flow for a synthetic enterprise program. |
| Use-case identification and business case design | [ai_assistant_business_case_playbook.md](ai_assistant_business_case_playbook.md), business-case view in [App.tsx](../src/App.tsx#L426), planner logic in [agents.py](../backend/app/agents.py#L196) | Demonstrates repeatable framing, value hypotheses, and prioritization logic. |
| Large-scale AI assistant rollout planning | persona portfolio, rollout waves, support model, business case, facilitation toolkit | Models the rollout mechanics without claiming live tenant access. |
| Readiness assessment and action planning | [ai_assistant_readiness_assessment.md](ai_assistant_readiness_assessment.md), readiness scorecard in [App.tsx](../src/App.tsx#L405) | Uses deterministic data and documented assumptions. |
| Training and champion enablement | [champion_launch_kit.md](champion_launch_kit.md), training surfaces in [App.tsx](../src/App.tsx#L489) | Keeps learning assets reusable across synthetic personas. |
| Adoption analytics and KPI interpretation | [value_realization_kpi_dictionary.md](value_realization_kpi_dictionary.md), adoption analytics views in [App.tsx](../src/App.tsx#L533) | Separates metric definitions from generated demo data. |
| Feedback and support operations | [feedback_support_operating_model.md](feedback_support_operating_model.md), support model in [App.tsx](../src/App.tsx#L510) | Shows intake, routing, and closure loops with synthetic signals. |
| Value realization measurement | planner output and KPI views in [agents.py](../backend/app/agents.py#L222), [value_realization_kpi_dictionary.md](value_realization_kpi_dictionary.md) | Demonstrates calculation paths and review cadence. |
| Change framework fluency | ADKAR framing in [ai_assistant_readiness_assessment.md](ai_assistant_readiness_assessment.md) | Describes framework usage without external certification claims. |
| Cross-functional stakeholder flow | persona portfolio, stakeholder lists, facilitation board | Keeps the workflow inspectable through UI and docs. |
| Communication and facilitation | [system_walkthrough_english.md](system_walkthrough_english.md), [facilitation_toolkit.md](facilitation_toolkit.md) | Provides a repeatable talk track and decision-room structure. |
| Multi-geo communication planning | [multi_geo_change_comms.md](multi_geo_change_comms.md), [champion_launch_kit.md](champion_launch_kit.md) | Models sequencing, localization, and channel governance. |
| Support-team feedback loop | [feedback_support_operating_model.md](feedback_support_operating_model.md), support and feedback model in the UI | Connects adoption issues to owner, status, and next action. |
| Decision facilitation | [facilitation_toolkit.md](facilitation_toolkit.md), facilitation section in [App.tsx](../src/App.tsx#L572) | Uses timers, parking lot, decision log, and action owners. |
| Objection handling and experiment design | experiment planner in [agents.py](../backend/app/agents.py#L128), objection cards in [App.tsx](../src/App.tsx#L596) | Converts uncertainty into bounded experiments with owners and dates. |

## Review Notes

- The data, personas, and organization scenarios are synthetic.
- The implementation is intended to show operating-model depth, software structure, and reviewable evidence paths.
- Framework references are descriptive only and do not imply certification ownership.
