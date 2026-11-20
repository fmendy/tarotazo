package es.arcana.ops;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

/**
 * Rate‑limit en memoria por IP (Bucket4j). La IP nunca se guarda ni se registra: se usa un HMAC con una clave
 * aleatoria generada al arrancar (efímera, sólo en memoria) como clave de un mapa Caffeine que expira en minutos.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private final boolean enabled;
    private final int perMinute;
    private final UsageMetrics metrics;
    private final SecretKeySpec key;
    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(2))
            .maximumSize(200_000)
            .build();

    public RateLimitFilter(@Value("${arcana.rate-limit.enabled:true}") boolean enabled,
                           @Value("${arcana.rate-limit.requests-per-minute:60}") int perMinute,
                           UsageMetrics metrics) {
        this.enabled = enabled;
        this.perMinute = perMinute;
        this.metrics = metrics;
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);
        this.key = new SecretKeySpec(secret, "HmacSHA256");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Bucket bucket = buckets.get(anonymize(request.getRemoteAddr()), k -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(request, response);
            return;
        }
        metrics.rateLimited();
        long retry = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(retry));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"error\":\"too_many_requests\",\"message\":\"Demasiadas consultas al más allá. "
                + "Respira y vuelve en " + retry + " s.\"}");
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(perMinute).refillGreedy(perMinute, Duration.ofMinutes(1)))
                .build();
    }

    /** Hash efímero de la IP: no reversible y distinto en cada arranque. */
    public String anonymize(String ip) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(key);
            byte[] h = mac.doFinal(String.valueOf(ip).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(java.util.Arrays.copyOf(h, 16));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
