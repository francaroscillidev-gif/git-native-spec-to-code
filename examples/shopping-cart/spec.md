# Specifica Tecnica: Shopping Cart Invariant Engine

## Requisiti di Sistema:
1. **Total Preservation**: Il totale del carrello non può mai essere inferiore a zero (`total >= 0`), anche applicando coupon di sconto aggressivi.
2. **Discount Idempotence**: L'applicazione ripetuta dello stesso coupon non deve cumulare sconti non autorizzati.
3. **Item Non-Negativity**: La quantità di ciascun articolo deve essere un intero strettamente positivo (`quantity >= 1`).
4. **Rounding Precision**: Il calcolo di tasse e sconti deve mantenere la consistenza monetaria a 2 cifre decimali.
