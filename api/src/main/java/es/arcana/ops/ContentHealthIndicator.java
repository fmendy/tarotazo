package es.arcana.ops;

import es.arcana.content.ContentRepository;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/** {@code content}: DOWN si no hay barajas o tiradas cargadas (no se podrían servir lecturas). */
@Component("content")
public class ContentHealthIndicator implements HealthIndicator {

    private final ContentRepository content;

    public ContentHealthIndicator(ContentRepository content) {
        this.content = content;
    }

    @Override
    public Health health() {
        Health.Builder b = content.decks().isEmpty() || content.spreads().isEmpty() ? Health.down() : Health.up();
        return b.withDetail("decks", content.decks().size())
                .withDetail("spreads", content.spreads().size())
                .withDetail("errors", content.report().errors().size())
                .withDetail("warnings", content.report().warnings().size())
                .build();
    }
}
