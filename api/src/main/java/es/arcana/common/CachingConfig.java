package es.arcana.common;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/** ETag débil calculado sobre el cuerpo en los GET de contenido: el navegador revalida con 304. */
@Configuration
public class CachingConfig {

    @Bean
    FilterRegistrationBean<ShallowEtagHeaderFilter> contentEtagFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> r = new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        r.setUrlPatterns(CacheHeadersAdvice.CACHEABLE_PATHS);
        r.setName("contentEtagFilter");
        return r;
    }
}
