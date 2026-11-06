# Specifica Tecnica: Token Bucket Rate Limiter

## Descrizione
Implementare un Rate Limiter basato sull'algoritmo **Token Bucket**.

## Requisiti e Invarianti di Sistema:
1. **Capacità e Inizializzazione**:
   - Il bucket viene istanziato con una `capacity` (massimo numero di token accumulabili) e un `refillRate` (numero di token aggiunti ogni secondo).
   - All'inizializzazione, il bucket è completamente pieno (`tokens == capacity`).
2. **Consumo (`tryConsume(cost)`)**:
   - Se i token disponibili sono maggiori o uguali a `cost`, vengono scalati esattamente `cost` token e il metodo restituisce `true`.
   - Se i token disponibili sono inferiori a `cost`, nessun token viene rimosso e il metodo restituisce `false`.
   - Il numero di token nel bucket non può mai scendere sotto zero.
3. **Refill nel Tempo (`advanceTime(elapsedMs)`)**:
   - I token si accumulano linearmente nel tempo secondo la formula:
     `added = floor((elapsedMs / 1000) * refillRate)`.
   - I token disponibili non devono MAI superare la `capacity` massima stabilita.
