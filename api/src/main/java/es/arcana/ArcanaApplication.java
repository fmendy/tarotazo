package es.arcana;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** «Tarotazo» — API sin estado ni base de datos. */
@SpringBootApplication
@ConfigurationPropertiesScan
public class ArcanaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ArcanaApplication.class, args);
    }
}
