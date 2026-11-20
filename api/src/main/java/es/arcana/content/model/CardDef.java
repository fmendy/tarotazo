package es.arcana.content.model;

public record CardDef(String id, String arcana, Integer number, String suit, String rank, Boolean court,
                      Boolean only48) {

    public boolean isMajor() {
        return "major".equals(arcana);
    }

    public boolean isCourt() {
        return Boolean.TRUE.equals(court);
    }

    public boolean isOnly48() {
        return Boolean.TRUE.equals(only48);
    }
}
