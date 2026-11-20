package es.arcana.content.model;

import java.util.List;

/** {@code {lang}/provinces/{code}.json} (CONTRACTS §2.4). */
public record ProvinceSheet(String code, String nombre, String comunidad, String gentilicio, List<String> plato,
                            List<String> fiesta, List<String> clima, List<String> chascarrillos) {

    public ProvinceSheet {
        plato = plato == null ? List.of() : List.copyOf(plato);
        fiesta = fiesta == null ? List.of() : List.copyOf(fiesta);
        clima = clima == null ? List.of() : List.copyOf(clima);
        chascarrillos = chascarrillos == null ? List.of() : List.copyOf(chascarrillos);
    }
}
