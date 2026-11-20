package es.arcana.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/** CORS sólo si {@code arcana.cors-origins} está definido (en dev el front usa el proxy de Vite). */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] corsOrigins;

    public WebConfig(@Value("${arcana.cors-origins:}") String corsOrigins) {
        this.corsOrigins = Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (corsOrigins.length == 0) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(corsOrigins)
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "Accept-Language")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
