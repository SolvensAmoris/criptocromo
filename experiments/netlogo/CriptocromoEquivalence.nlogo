extensions []

globals [
  initial-states
  input-path
  output-path
]

to setup
  clear-all
  set input-path "interop-data/initial_states.nls"
  set output-path "interop-data/netlogo_trace.csv"
  set initial-states []
  file-open input-path
  while [not file-at-end?] [
    set initial-states lput (read-from-string file-read-line) initial-states
  ]
  file-close
  file-open output-path
  file-print "kind,seed,variant,tick,node_or_i,j_or_empty,raw_or_weight,observed_or_empty,memory_or_empty,status"
  reset-ticks
end

to go
  foreach initial-states [ state-record ->
    run-one-state state-record "O"
    run-one-state state-record "D"
  ]
  tick
  file-close
  stop
end

to run-one-state [state-record variant]
  let seed item 0 state-record
  let preferred item 1 state-record
  let activations item 2 state-record
  let memories item 3 state-record
  let weights item 4 state-record
  let tick-index 0
  let aborted? false

  repeat 42 [
    if not aborted? [
      set tick-index tick-index + 1
      let intensity ifelse-value (tick-index <= 18) [1] [0]
      let raw-list []
      let i 0

      ; Compute every raw activation from the previous complete state.
      while [i < 24] [
        let distance 0.5 - item i preferred
        let resonance exp (0 - 18 * distance * distance)
        let neighbor-signal 0
        let j 0
        while [j < 24] [
          set neighbor-signal neighbor-signal +
            (item j (item i weights)) * (item j activations)
          set j j + 1
        ]
        let raw (0.72 * (item i activations)) +
          (0.42 * resonance * intensity) +
          (0.18 * neighbor-signal) +
          (0.24 * (item i memories))
        set raw-list lput raw raw-list
        set i i + 1
      ]

      let guard-hit? false
      if variant = "D" [
        let k 0
        while [k < 24] [
          if (abs (item k raw-list)) > 1000000 [ set guard-hit? true ]
          set k k + 1
        ]
      ]

      ifelse guard-hit? [
        set aborted? true
        let k 0
        while [k < 24] [
          file-print (word "N," seed "," variant "," tick-index "," k ",," (item k raw-list) ",,,guard_aborted")
          set k k + 1
        ]
      ] [
        let next-activations []
        let next-memories []
        let k 0
        while [k < 24] [
          let raw item k raw-list
          let observed ifelse-value (variant = "O") [min (list 1 (max (list 0 raw)))] [raw]
          set next-activations lput observed next-activations
          let next-memory min (list 1 (max (list 0 ((0.86 * (item k memories)) + (0.14 * (item k activations))))))
          set next-memories lput next-memory next-memories
          set k k + 1
        ]

        let next-weights []
        let i 0
        while [i < 24] [
          let next-row []
          let j 0
          while [j < 24] [
            let old-weight item j (item i weights)
            let new-weight old-weight
            if i != j [
              set new-weight min (list 1 (max (list 0
                (old-weight + (0.035 * (item i next-activations) * (item j next-activations)) - (0.008 * old-weight)))))
            ]
            set next-row lput new-weight next-row
            set j j + 1
          ]
          set next-weights lput next-row next-weights
          set i i + 1
        ]

        ; Record node-level raw, observed and memory state.
        set k 0
        while [k < 24] [
          file-print (word "N," seed "," variant "," tick-index "," k ",," (item k raw-list) "," (item k next-activations) "," (item k next-memories) ",completed")
          set k k + 1
        ]

        ; Record the complete directed weight matrix after this transition.
        set i 0
        while [i < 24] [
          set j 0
          while [j < 24] [
            file-print (word "W," seed "," variant "," tick-index "," i "," j "," (item j (item i next-weights)) ",,,completed")
            set j j + 1
          ]
          set i i + 1
        ]

        set activations next-activations
        set memories next-memories
        set weights next-weights
      ]
    ]
  ]
end

@#$#@#$#@
GRAPHICS-WINDOW
0
0
160
160
-1
-1
5.0
1
10
1
1
1
0
0
0
1
-10
10
-10
10
1
1
1
ticks
30.0
@#$#@#$#@
## PURPOSE
Cross-platform implementation comparison for the Criptocromo CAL-01 O/D model.
The model consumes canonical initial states exported by the Criptocromo TypeScript engine.
No NetLogo random-number generator is used in this experiment.

## INPUT
Run from the repository with the BehaviorSpace setup in behaviorspace.xml.
The model reads interop-data/initial_states.nls and writes interop-data/netlogo_trace.csv.

## UPDATE ORDER
Raw activations are calculated from the previous complete state. Activation and memory
updates are staged, then the full directed weight matrix is updated. The state is committed
only after the entire tick has been calculated.

## VARIANTS
O applies hard clipping to [0,1].
D preserves raw activation and aborts a trajectory when any raw activation exceeds
the absolute guard of 1,000,000.
@#$#@#$#@
default
0.0
-0.2
0
0.0
1.0
0.0
1
1.0
0.0
0.2
0
0.0
1.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180
@#$#@#$#@
NetLogo 7.0.4
@#$#@#$#@
need-to-manually-make-preview-for-this-model
@#$#@#$#@
0
@#$#@#$#@
