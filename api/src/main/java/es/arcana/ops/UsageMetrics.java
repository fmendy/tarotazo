package es.arcana.ops;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/** Contadores agregados (sin datos de usuario): lecturas por baraja/tirada y péndulo por modo. */
@Component
public class UsageMetrics {

    private final MeterRegistry registry;

    public UsageMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void reading(String deck, String spread) {
        registry.counter("arcana.readings", "deck", deck, "spread", spread).increment();
    }

    public void pendulum(String mode) {
        registry.counter("arcana.pendulum", "mode", mode).increment();
    }

    public void rateLimited() {
        registry.counter("arcana.ratelimit.rejected").increment();
    }
}
