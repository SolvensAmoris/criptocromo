# Observation Coverage Condition
## Version 0.1 | Prospective addendum to the behavioral-equivalence contract

**Status:** `DRAFT_NOT_FROZEN`  
**Applies to:** future comparisons evaluated under `BEHAVIORAL-EQUIVALENCE-CONTRACT-v0.3`.  
**Purpose:** define complete observation coverage as an observability precondition, separate from event-sequence matching and other behavioral comparisons.

## 1. Separation of concerns

Observation coverage answers whether the execution was validly observable throughout the declared horizon. Event equivalence answers whether the observed event sequences match under the task's structural and temporal criteria.

These are separate predicates. Matching events over a partial interval does not establish equivalence over the full horizon.

## 2. Per-run observation interval

For each execution (r), record its valid observation interval:

[
I_r=[s_r,e_r]
]

where:
- (s_r) is the first instant at which the execution was active and the required event instrumentation was valid;
- (e_r) is the last instant through which the execution remained active and required events could be validly recorded.

The interval is inclusive at both endpoints. The protocol must explicitly define the clock/tick convention and confirm whether an event timestamped exactly at (T) is captured. Under this addendum, the horizon endpoint (T) is included: an event at (T) is in scope and must be recordable.

The interval notation is valid only for a continuous, gap-free observation period. If instrumentation or recording becomes invalid during the run, record the valid observation set as separate intervals (or an explicit coverage mask); do not bridge gaps by reporting only the first and last timestamps.

## 3. Coverage predicates

Let the declared horizon be:

[
H=[0,T]
]

For each execution (r):

[
operatorname{Coverage}_r(T)
iff Hsubseteq I_r
]

For a gap-aware representation, let (O_r) be the set of instants with valid observation:

[
operatorname{Coverage}_r(T)
iff [0,T]subseteq O_r
]

Both reference and perturbed executions must cover the complete horizon:

[
operatorname{FullCoverage}(T)
iff
operatorname{Coverage}_{mathrm{ref}}(T)
land
operatorname{Coverage}_{mathrm{pert}}(T)
]

In the simple continuous-interval case, this requires (s_rleq0) and (e_rgeq T) for each run.

## 4. Event equivalence remains a separate predicate

Define (operatorname{StructuralMatch}) as exact agreement in event identity/category, relevant attributes, event count, and order, using the predeclared deterministic one-to-one matching rule.

For each matched event (i), define:

[
Delta_i=|t_i^{p}-t_i^{r}|
]

and require:

[
orall i,quad Delta_ileq	au
]

where (	au) is fixed and justified before examining campaign results.

For the event-sequence example, the complete acceptance rule is:

[
egin{aligned}
operatorname{ACCEPT}iff{}&
operatorname{FullCoverage}(T)\
&landoperatorname{StructuralMatch}\
&landorall i, |t_i^{p}-t_i^{r}|leq	au
end{aligned}
]

Coverage does not relax event identity, count, order, or timing requirements. Conversely, a structurally and temporally matching observed prefix cannot compensate for incomplete coverage.

## 5. Incomplete or invalid observation

If either run ends before (T), loses required instrumentation, or has an observation gap that prevents valid event capture anywhere in ([0,T]), then (operatorname{FullCoverage}(T)) is false.

If no independent, predeclared rejection rule has already been violated by validly observed evidence, classify the full-horizon comparison as:

[
	exttt{INDETERMINATE/CENSORED}
]

Do not classify it as `ACCEPT`. Do not treat unobserved events as absent, and do not impute unobserved values as zero.

If a separate, predeclared task-failure rule is already violated by observed evidence, record that `REJECT` reason while also preserving the incomplete-coverage diagnostic. A guard or instrumentation failure is not automatically a behavioral mismatch unless the task contract independently defines it as a qualitative failure.

## 6. Boundary example

For (T=100):
- A run validly observed over ([0,100]), including the endpoint, satisfies coverage.
- A run observed only over ([0,80]) does not satisfy coverage, even if all events observed through tick 80 match the reference.
- A run whose recorder is invalid over ticks 40–45 does not have full coverage, even if it resumes and remains active through tick 100.
- An event timestamped exactly at tick 100 must be captured and included in the event comparison; otherwise the endpoint is not validly covered for that event stream.

## 7. Minimum recording fields

For each run, preserve:
- declared horizon (T) and endpoint convention;
- first valid observation instant (s_r);
- last valid observation instant (e_r);
- valid observation intervals or coverage mask when gaps are possible;
- process-active intervals;
- instrumentation/recorder validity intervals;
- termination or recorder-loss reason and timestamp;
- whether events at the exact endpoint (T) are captured;
- computed `Coverage_r(T)` and `FullCoverage(T)`.

The process being active is not sufficient by itself: required event instrumentation must also be valid.

---

**Interpretation boundary:** complete coverage is a condition of observability. It does not explain why events occurred, establish causality, or revise historical experiment results. This addendum is prospective and does not authorize a campaign.
