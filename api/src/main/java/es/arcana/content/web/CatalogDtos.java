package es.arcana.content.web;

import java.util.List;
import java.util.Map;

/** DTOs de los GET de catálogo (CONTRACTS §6). */
public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record DeckDto(String family, String name, String description, String defaultModel,
                          List<ModelDto> models) {
    }

    /** {@code numerals}: numeral mostrado por carta cuando difiere del estándar (extensión aditiva). */
    public record ModelDto(String id, String name, String description, int deckSize, String backImage,
                           String previewImage, String imagePattern, boolean available,
                           Map<String, String> numerals) {
    }

    /** {@code minSize}: sólo en tiradas de tamaño variable (p. ej. {@code sino}, 1–3); extensión aditiva. */
    public record SpreadDto(String id, String name, String description, int size, Integer minSize, String layout,
                            List<PositionDto> positions) {
    }

    public record PositionDto(String id, String label) {
    }

    /** {@code gentilicio} y {@code zona}: extensiones aditivas pedidas por Datos/Frontend. */
    public record ProvinceDto(String code, String nombre, String comunidad, String gentilicio, String zona,
                              String teaser) {
    }
}
