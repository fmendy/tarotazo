package es.arcana.narrative;

import es.arcana.content.model.ProvinceDef;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.content.model.ServerLabels;

import java.util.Optional;

/**
 * Valor de {@code {provincia}} (resolución QA-01/QA-12): {@code XX} → «tierras lejanas», sin provincia → «la tierra»
 * (etiquetas {@code provinciaExtranjero} / {@code provinciaDesconocida} de las server labels); si no, el nombre de la
 * ficha o de {@code provinces.json}.
 */
public final class ProvinceNames {

    public static final String ABROAD = "XX";

    private ProvinceNames() {
    }

    public static Optional<String> provincia(ServerLabels labels, String code, Optional<ProvinceSheet> sheet,
                                             Optional<ProvinceDef> def) {
        if (code == null) {
            return Optional.ofNullable(labels.provinciaDesconocida());
        }
        if (ABROAD.equals(code)) {
            return Optional.ofNullable(labels.provinciaExtranjero());
        }
        return sheet.map(ProvinceSheet::nombre).or(() -> def.map(ProvinceDef::nombre));
    }
}
