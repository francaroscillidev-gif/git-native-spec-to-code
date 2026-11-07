--------------------------- MODULE TokenBucketRateLimiter ---------------------------
EXTENDS Integers, Naturals

CONSTANTS MaxCapacity, RefillRate
VARIABLES tokens, clock

TypeInvariant ==
    /\ tokens \in 0..MaxCapacity
    /\ clock \in Nat

Init ==
    /\ tokens = MaxCapacity
    /\ clock = 0

AdvanceTime ==
    \E dt \in 1..10:
        /\ clock' = clock + dt
        /\ tokens' = IF tokens + (dt * RefillRate) > MaxCapacity
                      THEN MaxCapacity
                      ELSE tokens + (dt * RefillRate)

Consume(cost) ==
    /\ tokens >= cost
    /\ tokens' = tokens - cost
    /\ clock' = clock

Next ==
    \/ AdvanceTime
    \/ (\E cost \in 1..MaxCapacity: Consume(cost))

Spec == Init /\ [][Next]_<<tokens, clock>>

-----------------------------------------------------------------------------
THEOREM Spec => []TypeInvariant
=============================================================================
