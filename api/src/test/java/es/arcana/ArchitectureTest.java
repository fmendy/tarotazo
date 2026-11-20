package es.arcana;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/** Separación de módulos: content ← narrative ← {reading, pendulum}; ops y common transversales. */
@AnalyzeClasses(packages = "es.arcana", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule readingNoDependeDePendulum = noClasses().that().resideInAPackage("es.arcana.reading..")
            .should().dependOnClassesThat().resideInAPackage("es.arcana.pendulum..");

    @ArchTest
    static final ArchRule pendulumNoDependeDeReading = noClasses().that().resideInAPackage("es.arcana.pendulum..")
            .should().dependOnClassesThat().resideInAPackage("es.arcana.reading..");

    @ArchTest
    static final ArchRule contentNoDependeDeNadieSalvoCommon = noClasses().that().resideInAPackage("es.arcana.content..")
            .should().dependOnClassesThat().resideInAnyPackage("es.arcana.narrative..", "es.arcana.reading..",
                    "es.arcana.pendulum..", "es.arcana.ops..");

    @ArchTest
    static final ArchRule narrativeNoDependeDeLecturaNiPendulo = noClasses().that().resideInAPackage("es.arcana.narrative..")
            .should().dependOnClassesThat().resideInAnyPackage("es.arcana.reading..", "es.arcana.pendulum..",
                    "es.arcana.ops..");

    @ArchTest
    static final ArchRule commonEsHoja = noClasses().that().resideInAPackage("es.arcana.common..")
            .should().dependOnClassesThat().resideInAnyPackage("es.arcana.content..", "es.arcana.narrative..",
                    "es.arcana.reading..", "es.arcana.pendulum..", "es.arcana.ops..");

    @ArchTest
    static final ArchRule soloContentLeeFicheros = noClasses().that().resideOutsideOfPackage("es.arcana.content..")
            .should().dependOnClassesThat().resideInAnyPackage("java.nio.file..")
            .orShould().dependOnClassesThat().haveFullyQualifiedName("java.io.File")
            .orShould().dependOnClassesThat().haveFullyQualifiedName("java.io.FileInputStream")
            .orShould().dependOnClassesThat().resideInAPackage("org.springframework.core.io..");

    @ArchTest
    static final ArchRule sinCiclos = slices().matching("es.arcana.(*)..").should().beFreeOfCycles();
}
