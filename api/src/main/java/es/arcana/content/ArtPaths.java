package es.arcana.content;

/** Rutas públicas del arte (CONTRACTS §8). */
public final class ArtPaths {

    private ArtPaths() {
    }

    public static String back(String art) {
        return "/art/backs/" + art + ".svg";
    }

    public static String card(String art, String cardId) {
        return "/art/cards/" + art + "/" + cardId + ".svg";
    }

    public static String pattern(String art) {
        return "/art/cards/" + art + "/{cardId}.svg";
    }
}
