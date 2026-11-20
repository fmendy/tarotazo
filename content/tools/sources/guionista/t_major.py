# -*- coding: utf-8 -*-
# Arcanos mayores (numeración RWS). Cada carta: keywords, upright, reversed.
M = {}

def card(cid, kw, up, rev):
    M[cid] = {"keywords": kw, "upright": up, "reversed": rev}

card("mayor-00", ["inicio", "espontaneidad", "salto de fe", "libertad"],
 {"general": [
   "El Loco abre camino: un comienzo con más ilusión que mapa. Te veo con ganas de dar un salto, y el universo, por una vez, te pone colchoneta.",
   "Es la carta del primer paso. No hace falta tenerlo todo claro; hace falta mochila ligera y curiosidad. Lo que empieces ahora tiene buena estrella, aunque vaya sin GPS."],
  "amor": ["En el amor sopla aire fresco: una relación que empieza o una forma nueva de vivir la que ya tienes. Déjate sorprender, que planificarlo todo no es romántico, es una hoja de cálculo.",
           "Ligereza en lo sentimental: ganas de jugar, de conocer gente y de no tomarse todo a la tremenda."],
  "trabajo": ["Proyecto nuevo, cambio de rumbo o idea loca que, ojo, puede salir bien. Atrévete, pero mira dónde pisas: el Loco va mirando al cielo y el precipicio está ahí."],
  "dinero": ["Ganas de estrenar cosas. Bien por la ilusión, pero en lo económico conviene que el entusiasmo vaya acompañado de una calculadora."],
  "salud": ["Energía de estreno: buen momento para empezar un hábito saludable sencillo, como andar más o dormir a horas cristianas."]},
 {"general": [
   "El Loco del revés tropieza con sus propios cordones: prisas, despistes y decisiones tomadas a lo loco. Antes de saltar, mira si hay agua en la piscina.",
   "También puede indicar lo contrario: miedo a empezar. Llevas tiempo con la maleta hecha en la puerta y sin salir de casa."],
  "amor": ["Cuidado con las aventuras sin cabeza o con huir en cuanto algo se pone serio. La libertad está muy bien, pero no hace falta salir corriendo a la primera cena."],
  "trabajo": ["Ideas brillantes sin plan, o un plan que no arranca por miedo. Ni tanto ni tan calvo: un paso pequeño vale más que diez saltos imaginarios."],
  "dinero": ["Gastos impulsivos a la vista. El Loco invertido es ese «total, por un capricho» repetido treinta veces."],
  "salud": ["Despistes y descuidos: ojo con los pequeños tropiezos por ir con prisa. Más calma y menos correr con el café en la mano."]})

card("mayor-01", ["voluntad", "habilidad", "recursos", "iniciativa"],
 {"general": [
   "El Mago pone sobre la mesa todas las herramientas: tienes lo que necesitas, solo falta usarlo. Es momento de pasar de la idea a la acción, con varita o sin ella.",
   "Carta de talento y de mano izquierda. Lo que te propongas ahora tiene muchas papeletas, porque te veo con chispa, cabeza y ganas."],
  "amor": ["Encanto a raudales: es buen momento para dar el primer paso o para decir eso que llevas tiempo ensayando delante del espejo.",
           "Seducción con ingenio. La palabra adecuada en el momento justo hace más que mil flores."],
  "trabajo": ["Iniciativa, propuestas, presentaciones: el Mago te dice que te luzcas. Lo que sabes hacer vale, y toca que se note."],
  "dinero": ["Capacidad para generar recursos con tus propias habilidades. Ingenio antes que suerte: aquí el truco eres tú."],
  "salud": ["Buen momento para tomar las riendas de tus rutinas: tienes fuerza de voluntad para empezar lo que siempre aplazas."]},
 {"general": [
   "El Mago invertido tiene los trastos, pero se le ha caído la chistera. Talento desaprovechado, inseguridad o ganas de liarla con palabrería.",
   "Ojo con los vendedores de humo, incluido el que a veces llevas dentro. Más hechos y menos «ya verás»."],
  "amor": ["Promesas muy bonitas y pocas obras. O alguien que te encandila con trucos de feria. Mira lo que hace, no lo que dice."],
  "trabajo": ["Proyectos que no despegan por falta de foco o por querer abarcarlo todo. Elige una herramienta y úsala bien."],
  "dinero": ["Desconfía de los atajos milagrosos y de quien promete duros a cuatro pesetas."],
  "salud": ["Energía dispersa: muchas intenciones y poca constancia. Mejor un hábito pequeño que diez propósitos de lunes."]})

card("mayor-02", ["intuición", "misterio", "silencio", "sabiduría interior"],
 {"general": [
   "La Sacerdotisa pide silencio y escucha. Hay cosas que todavía no se ven, pero tu intuición ya las ha olido. Hazle caso, que suele acertar más que yo.",
   "Carta de secretos y de saber esperar. No es momento de gritar planes, sino de observar y guardar las cartas cerca del pecho."],
  "amor": ["Algo se está gestando en silencio: sentimientos que no se dicen, miradas que sí. Paciencia, que lo que se cuece a fuego lento sabe mejor."],
  "trabajo": ["Información que aún no está sobre la mesa. Estudia, observa y no enseñes todavía tu jugada."],
  "dinero": ["Prudencia y discreción. Antes de mover un céntimo, que tu intuición y tus números estén de acuerdo."],
  "salud": ["Escucha a tu cuerpo, que habla bajito pero claro. Descanso, calma y ratos de silencio te sentarán de maravilla."]},
 {"general": [
   "La Sacerdotisa invertida tiene el oído tapado: estás ignorando lo que ya sabes por dentro. O hay secretos que empiezan a pesar.",
   "Desconexión de la intuición. Demasiado ruido fuera para oír lo que pasa dentro."],
  "amor": ["Cosas no dichas que enfrían. O alguien que guarda más de la cuenta. Un poco de sinceridad aireará la habitación."],
  "trabajo": ["Rumores, información a medias o decisiones tomadas sin mirar el fondo. Pregunta antes de suponer."],
  "dinero": ["Algo que no estás mirando de frente. Abre ese sobre, que la cuenta no se arregla escondiéndola en el cajón."],
  "salud": ["No hagas oídos sordos a tu cansancio. Bajar el ritmo un poco es sabiduría, no pereza."]})

card("mayor-03", ["abundancia", "creatividad", "fertilidad de ideas", "cuidado"],
 {"general": [
   "La Emperatriz trae abundancia, belleza y cosas que florecen. Lo que siembres ahora crece. Es la carta de disfrutar, crear y cuidarse sin pedir perdón.",
   "Momento fértil para proyectos, ideas y afectos. Te veo con un aura de huerta en mayo: todo brota."],
  "amor": ["Ternura, sensualidad y cariño en abundancia. Si hay pareja, se mima; si no la hay, te vas a mimar tú, que también cuenta.",
           "Relaciones que crecen y se asientan con calidez. Mucho abrazo y mucha sobremesa."],
  "trabajo": ["Creatividad en su punto: lo que tocas, prospera. Ideal para proyectos que necesitan sensibilidad y paciencia."],
  "dinero": ["Comodidad y cierta holgura. Disfruta de lo que tienes, que la abundancia también es saber apreciar."],
  "salud": ["Placer y autocuidado: comer rico, dormir bien y estar al sol. Mimarte es parte de estar bien."]},
 {"general": [
   "La Emperatriz invertida se ha olvidado de regarse a sí misma. Creatividad bloqueada o tanto cuidar a los demás que te quedas sin flores.",
   "Exceso de comodidad o de control: el jardín, si lo agobias, tampoco crece."],
  "amor": ["Dependencia o sobreprotección. Querer no es asfixiar, y cuidar no es hacerle la vida a nadie."],
  "trabajo": ["Bloqueo creativo. No fuerces: un paseo o un cambio de aires desatascan más que mirar la pantalla en blanco."],
  "dinero": ["Caprichos para tapar otras cosas. Antes del carrito de la compra, pregúntate si es hambre o aburrimiento."],
  "salud": ["Te estás dejando para el final. Ponte en la lista de cuidados, y no al fondo."]})

card("mayor-04", ["estructura", "autoridad", "estabilidad", "orden"],
 {"general": [
   "El Emperador pone orden: estructura, normas y firmeza. Es momento de organizarte, marcar límites y construir sobre cimientos sólidos.",
   "Carta de liderazgo y de tomar el mando. Hoy toca ser la persona adulta de la sala, aunque sea con pantuflas."],
  "amor": ["Estabilidad y compromiso. Relaciones con los pies en el suelo, donde las cosas se hablan y se cumplen."],
  "trabajo": ["Autoridad, responsabilidades y reconocimiento. Te toca dirigir o tratar con alguien que dirige. Organización ante todo."],
  "dinero": ["Disciplina y planificación. El Emperador no improvisa: hace presupuesto y lo cumple."],
  "salud": ["Rutinas firmes: horarios, descanso y constancia. El orden también es salud."]},
 {"general": [
   "El Emperador invertido o se ha vuelto un mandón o ha perdido el trono. Rigidez, control excesivo o falta total de estructura.",
   "Choques con la autoridad: un jefe, una norma, un padre... o tu propio sargento interior."],
  "amor": ["Quien quiere tener razón siempre acaba cenando sin compañía. Menos control y más escucha."],
  "trabajo": ["Problemas con jerarquías o desorden que pasa factura. Ni dictadura ni caos: busca el término medio."],
  "dinero": ["O todo controlado al céntimo con angustia, o un descontrol de cuidado. Ni lo uno ni lo otro."],
  "salud": ["Exigirte demasiado también cansa. Flexibilidad: el roble aguanta, pero el junco no se parte."]})

card("mayor-05", ["tradición", "enseñanza", "consejo", "instituciones"],
 {"general": [
   "El Hierofante habla de tradición, aprendizaje y buenos consejos. Alguien con experiencia puede ayudarte, o te toca a ti ser esa voz sabia.",
   "Carta de lo establecido: estudios, ceremonias, normas que funcionan. A veces lo de toda la vida es lo que mejor sale."],
  "amor": ["Compromisos formales, pasos tradicionales, presentar a la familia. Amor de los de toda la vida, con sus ritos y su tortilla de domingo."],
  "trabajo": ["Formación, mentores e instituciones. Buen momento para aprender o para seguir el procedimiento, aunque sea aburrido."],
  "dinero": ["Prudencia clásica: lo conocido, lo estable, lo que recomienda alguien de confianza con canas en el tema."],
  "salud": ["Buen momento para hacer caso a quien sabe: seguir pautas de profesionales y no del cuñado."]},
 {"general": [
   "El Hierofante invertido rompe moldes: dudas sobre las normas, ganas de ir por libre o consejos que ya no te sirven.",
   "Rebeldía sana o dogmatismo cansino: depende de si eres tú quien rompe la regla o quien la impone."],
  "amor": ["Relaciones que no siguen el guion clásico, y no pasa nada. O presión familiar sobre lo que «toca». Escucha, pero decide tú."],
  "trabajo": ["Choque con normas o con la forma de hacer las cosas de siempre. Plantea alternativas, pero con argumentos."],
  "dinero": ["No sigas un consejo económico solo porque lo dice alguien con corbata. Infórmate bien."],
  "salud": ["Ojo con remedios milagrosos y gurús de internet. Lo innovador está bien si lo avala quien sabe."]})

card("mayor-06", ["amor", "elección", "unión", "valores"],
 {"general": [
   "Los Enamorados hablan de elecciones del corazón: decidir según lo que de verdad valoras. Una encrucijada que pide sinceridad contigo.",
   "Armonía, unión y alianzas. Algo encaja, como la croqueta con la servilleta."],
  "amor": ["Carta de amor por excelencia: atracción, conexión y química. Si hay alguien, la cosa promete; si no, el corazón está con la puerta abierta.",
           "Una elección sentimental importante. Elige con el corazón, pero que el corazón haya desayunado."],
  "trabajo": ["Asociaciones y colaboraciones que funcionan. También una decisión entre dos caminos: el que te ilusiona suele ser el bueno."],
  "dinero": ["Decisiones a dos o acuerdos compartidos. Hablar las cuentas claras también es una forma de amor."],
  "salud": ["Equilibrio entre lo que te apetece y lo que te conviene. Elegir bien también es cuidarse."]},
 {"general": [
   "Los Enamorados invertidos dudan: indecisión, desequilibrios o elegir por los motivos equivocados.",
   "Algo no encaja entre lo que piensas y lo que haces. Toca alinear cabeza y corazón."],
  "amor": ["Desencuentros, terceras opciones que confunden o una relación que va a dos velocidades. Hablar despacio y sin móviles en la mesa."],
  "trabajo": ["Socios que no reman igual o una decisión que llevas aplazando. Elegir también es renunciar, y está bien."],
  "dinero": ["Desacuerdos sobre gastos compartidos. Cuentas claras y chocolate espeso."],
  "salud": ["Tira y afloja entre el sofá y tus buenos propósitos. Busca un pacto que puedas cumplir."]})

card("mayor-07", ["avance", "determinación", "victoria", "control"],
 {"general": [
   "El Carro arranca: determinación, avance y victoria por méritos propios. Llevas las riendas y el viento a favor. Arre.",
   "Carta de movimiento. Viajes, progresos y superar obstáculos a base de voluntad y buena conducción."],
  "amor": ["Tomas la iniciativa y avanzas. Relaciones que dan un paso adelante, o tú que decides lo que quieres sin titubeos."],
  "trabajo": ["Éxito por empuje y constancia. Objetivos que se cumplen y competiciones que se ganan."],
  "dinero": ["Avances gracias al esfuerzo propio. Controlas el rumbo; solo vigila no acelerar en las curvas."],
  "salud": ["Energía y vitalidad para ponerte en marcha. Moverse sienta bien, aunque sea en el carro de la compra."]},
 {"general": [
   "El Carro invertido va con el freno de mano echado: falta de dirección, caballos que tiran cada uno hacia un lado.",
   "Prisas que hacen perder el control. Para, respira y mira el mapa antes de seguir."],
  "amor": ["Uno tira hacia un lado y otro hacia el contrario. Pactad un destino antes de arrancar."],
  "trabajo": ["Retrasos, bloqueos o frustración por no avanzar. A veces el atasco te salva de una multa."],
  "dinero": ["Impulsos sin dirección. Reduce marcha y revisa hacia dónde va lo que entra y lo que sale."],
  "salud": ["Ir a todo trapo pasa factura. Baja revoluciones antes de que el cuerpo te ponga un cono."]})

card("mayor-08", ["fuerza interior", "coraje", "paciencia", "dominio"],
 {"general": [
   "La Fuerza no es de gimnasio: es la del carácter. Paciencia, temple y valor para amansar leones, incluidos los tuyos.",
   "Te veo con más coraje del que crees. Lo que parece imposible se resuelve con calma y mano suave."],
  "amor": ["Amor que se sostiene con paciencia y ternura. Comprensión, cariño y saber cuándo callar."],
  "trabajo": ["Superas presiones con aplomo. Tu serenidad convence más que cualquier grito."],
  "dinero": ["Autocontrol: resistir caprichos es la fuerza más rentable de todas."],
  "salud": ["Buena energía y resistencia. Cuida esa fuerza con descanso y sin pasarte de vueltas."]},
 {"general": [
   "La Fuerza invertida tiene el león suelto: inseguridad, impaciencia o dudas sobre tu valía.",
   "Te estás infravalorando. Tienes más fuerza de la que te reconoces; solo hace falta recordarlo."],
  "amor": ["Celos, inseguridades o perder los nervios. El león se calma con caricias, no con gritos."],
  "trabajo": ["Te cuesta imponerte o te imponen demasiado. Ni felpudo ni volcán."],
  "dinero": ["Falta de autocontrol con los gastos. La tarjeta también es un león: tenla domada."],
  "salud": ["Bajón de energía. No es momento de heroicidades: descanso y paciencia."]})

card("mayor-09", ["introspección", "búsqueda", "soledad elegida", "guía"],
 {"general": [
   "El Ermitaño enciende su farol: toca mirar hacia dentro, tomar distancia y pensar. Un retiro, aunque sea en el sofá con una manta.",
   "Carta de sabiduría y de buscar respuestas propias. El Ermitaño te dice: apaga el móvil y date un paseo."],
  "amor": ["Necesidad de espacio para entender qué quieres. Estar a solas un rato no es estar en soledad: es ordenar el armario del corazón."],
  "trabajo": ["Estudio, especialización y trabajo concienzudo. Lo que hagas a tu ritmo y con detalle sale mejor."],
  "dinero": ["Prudencia y austeridad elegida. Revisar con calma, sin prisas ni presiones ajenas."],
  "salud": ["Descanso mental, paseos y silencio. Bajar el volumen del mundo te sentará fenomenal."]},
 {"general": [
   "El Ermitaño invertido se ha encerrado demasiado: aislamiento, desconexión o miedo a pedir ayuda.",
   "O lo contrario: tanto ruido fuera que no te dejas ni un minuto para pensar."],
  "amor": ["Aislarse para no sufrir también hace sufrir. Abre una ventana, aunque sea un poquito."],
  "trabajo": ["Trabajar en solitario ya no te está ayudando. Pide opinión: dos faroles iluminan más."],
  "dinero": ["Tacañería por miedo o despreocupación por no querer mirar. Equilibrio y luz en las cuentas."],
  "salud": ["Cuidado con aislarte de más. Hablar con alguien de confianza también es cuidarse."]})

card("mayor-10", ["ciclos", "destino", "cambio de suerte", "oportunidad"],
 {"general": [
   "La Rueda de la Fortuna gira: cambios de suerte, ciclos que se cierran y oportunidades que llegan cuando menos lo esperas. Agárrate, que viene curva buena.",
   "Lo que estaba abajo sube. El destino mueve ficha y conviene no perder de vista las señales."],
  "amor": ["Giros inesperados en lo sentimental: encuentros casuales que no lo son tanto, o una relación que cambia de etapa."],
  "trabajo": ["Cambios y oportunidades. Lo que parecía estancado se mueve. Aprovecha el impulso."],
  "dinero": ["Ciclos: épocas de más y de menos. Disfruta la buena racha con sensatez, que la rueda sigue girando."],
  "salud": ["Etapa de cambios en tus rutinas. Adáptate con calma y busca hábitos que te sienten bien."]},
 {"general": [
   "La Rueda invertida da la vuelta al revés: contratiempos, resistencia al cambio o una racha regulera. Tranquilidad: ninguna rueda se para para siempre.",
   "Insistes en que las cosas sigan igual, y la rueda insiste en girar. Suelta un poco el freno."],
  "amor": ["Repites patrones que ya conoces. Si siempre eliges igual, la rueda siempre para en la misma casilla."],
  "trabajo": ["Retrasos y planes que se tuercen. No es culpa tuya, es la meteorología del destino. Espera y prepárate."],
  "dinero": ["Racha floja. Momento de prudencia y de no tentar a la suerte."],
  "salud": ["Altibajos de energía. Constancia suave: lo que se repite, se asienta."]})

card("mayor-11", ["equilibrio", "verdad", "responsabilidad", "decisiones justas"],
 {"general": [
   "La Justicia pesa en su balanza: verdad, equilibrio y consecuencias. Lo que has sembrado, se recoge. Si has hecho bien las cosas, toca cobrar.",
   "Carta de decisiones con cabeza fría. Valora pros y contras y actúa con honestidad."],
  "amor": ["Equilibrio en la pareja: dar y recibir a partes iguales. Conversaciones claras que ponen cada cosa en su sitio."],
  "trabajo": ["Contratos, acuerdos y papeles que salen adelante si todo está en regla. Objetividad ante todo."],
  "dinero": ["Cuentas claras. Lo justo se cobra y lo pendiente se paga. Revisa papeles y facturas."],
  "salud": ["Equilibrio: ni excesos ni privaciones. La balanza, en su punto."]},
 {"general": [
   "La Justicia invertida tiene la balanza torcida: injusticias, decisiones parciales o evitar responsabilidades.",
   "Algo no está equilibrado y lo sabes. Ser justo empieza por ser sincero contigo."],
  "amor": ["Desequilibrio: alguien da mucho más que el otro. Hablarlo es el primer paso para nivelar."],
  "trabajo": ["Papeleos que se atascan o tratos poco claros. Lee la letra pequeña, que la carga el diablo."],
  "dinero": ["Descuadres, cuentas pendientes o falta de orden. Pon todo sobre la mesa antes de que la mesa se queje."],
  "salud": ["Excesos que se notan. Recupera el equilibrio sin castigarte."]})

card("mayor-12", ["pausa", "nueva perspectiva", "entrega", "espera"],
 {"general": [
   "El Colgado está boca abajo y tan tranquilo: pausa, cambio de perspectiva y aceptar que ahora toca esperar. Desde ahí se ven cosas que de pie no.",
   "A veces soltar es avanzar. Lo que parece un parón es una oportunidad para mirar desde otro ángulo."],
  "amor": ["Una relación en pausa o un sentimiento que necesita tiempo. No fuerces: mira la situación desde el otro lado."],
  "trabajo": ["Proyectos en espera. No es pérdida de tiempo: es tiempo para replantear y llegar mejor."],
  "dinero": ["Momento de no mover ficha. Esperar también es una estrategia."],
  "salud": ["Descanso obligatorio del alma: para, estira (bien, no colgándote) y respira."]},
 {"general": [
   "El Colgado invertido se ha cansado de estar colgado y patalea: impaciencia, estancamiento o sacrificios que no llevan a nada.",
   "Llevas demasiado tiempo esperando algo que no llega. Quizá toca bajarse del árbol y cambiar de plan."],
  "amor": ["Sacrificarse de más por alguien que no mueve un dedo. Esperar está bien; esperar eternamente, no."],
  "trabajo": ["Bloqueo que ya cansa. Si nada cambia, cambia tú algo, aunque sea pequeño."],
  "dinero": ["Dejar las cosas para luego tiene un precio. Ponte una fecha y cúmplela."],
  "salud": ["El parón se alarga. Retoma poco a poco una rutina que te active."]})

card("mayor-13", ["cambio", "cierre", "transformación", "renovación"],
 {"general": [
   "La Muerte. Tranquilidad, que aquí no se muere nadie: es la carta del cambio y de cerrar etapas. Algo termina para que otra cosa mejor tenga sitio. Vamos, una limpieza de armario a lo grande.",
   "Transformación profunda. Lo viejo se va y lo nuevo llega con aire fresco. Despedirse cuesta, pero lo que viene merece la pena."],
  "amor": ["Final de una etapa sentimental para empezar otra. Puede ser una relación que cambia de piel o un capítulo que se cierra con elegancia."],
  "trabajo": ["Cierre de un ciclo laboral: un puesto, un proyecto, una forma de trabajar. Lo que llega después será otra cosa, y probablemente mejor."],
  "dinero": ["Se acaba una forma de manejar tus recursos. Buen momento para renovar hábitos y dejar atrás lo que ya no te sirve."],
  "salud": ["Renovación: cambiar hábitos viejos por otros nuevos. Tirar a la basura el «ya empezaré el lunes»."]},
 {"general": [
   "La Muerte invertida se resiste al cambio: te agarras a lo que ya terminó como quien no quiere tirar un táper sin tapa.",
   "Transformación a medias. El cambio llega igual, pero si lo aceptas duele menos y tarda menos."],
  "amor": ["Algo que ya acabó y no termina de cerrarse. Pasar página no es olvidar: es dejar sitio."],
  "trabajo": ["Miedo a cambiar de rumbo. Quedarse por inercia también es una decisión, y no siempre la mejor."],
  "dinero": ["Viejos hábitos que no sueltas. Revisa qué gastos son costumbre y no necesidad."],
  "salud": ["Te cuesta dejar una rutina que no te conviene. Cambiar poco a poco también vale."]})

card("mayor-14", ["moderación", "armonía", "paciencia", "equilibrio"],
 {"general": [
   "La Templanza mezcla con calma: equilibrio, paciencia y el arte del término medio. Ni mucho ni poco, lo justo, como el punto de sal.",
   "Armonía y serenidad. Las cosas se resuelven a su ritmo; tú solo dosifica bien."],
  "amor": ["Relaciones equilibradas, reconciliaciones y comprensión mutua. Amor sin dramas, a fuego lento."],
  "trabajo": ["Cooperación y buen hacer. Combinas talentos y personas con mano de cocinero fino."],
  "dinero": ["Moderación: ni tacañería ni derroche. El presupuesto zen."],
  "salud": ["Equilibrio y moderación en todo: comidas, descanso, pantallas. La palabra mágica es «dosificar»."]},
 {"general": [
   "La Templanza invertida se pasa con la mezcla: excesos, prisas o desequilibrio entre lo que das y lo que recibes.",
   "Impaciencia: quieres el guiso hecho y aún no has pelado las patatas."],
  "amor": ["Tensiones por falta de equilibrio. Alguien pide más paciencia de la que hay en la despensa."],
  "trabajo": ["Desorganización o ir a contrarreloj. Ajusta tiempos y no lo quieras todo para ayer."],
  "dinero": ["Excesos puntuales que desajustan. Vuelve al término medio sin dramas."],
  "salud": ["Excesos que conviene moderar. Recupera tu ritmo con calma, sin castigos."]})

card("mayor-15", ["ataduras", "tentación", "deseo", "dependencia"],
 {"general": [
   "El Diablo no da miedo, da tentaciones: ataduras, vicios pequeños y cosas que te enganchan más de la cuenta. Mira bien las cadenas: suelen estar flojas.",
   "Carta del deseo y del materialismo. Disfrutar está bien; lo que no está tan bien es que el capricho te lleve de la correa."],
  "amor": ["Pasión intensa y mucha química. Ojo con confundir atracción con dependencia: el fuego calienta, pero también quema."],
  "trabajo": ["Un trabajo que te ata más de lo que te gustaría, o ambición que se come tu tiempo libre. ¿Quién manda aquí?"],
  "dinero": ["Tentaciones de gasto y apego a lo material. Antes de comprar, pregúntate si lo quieres o te quiere a ti."],
  "salud": ["Revisa hábitos que te enganchan: pantallas, azúcar, trasnochar. Pequeños cambios, grandes liberaciones."]},
 {"general": [
   "El Diablo invertido suelta las cadenas: liberación, romper con lo que te ataba y recuperar el control. Un alivio de los buenos.",
   "Tomas conciencia de lo que te enganchaba. Ver la cadena es el primer paso para quitártela."],
  "amor": ["Te liberas de una relación o dinámica que te ataba. Respira: ahora eliges tú."],
  "trabajo": ["Dejas atrás una situación que te asfixiaba o pones límites por fin. Bien hecho."],
  "dinero": ["Recuperas el control de tus gastos. Adiós a las suscripciones fantasma."],
  "salud": ["Buen momento para dejar un mal hábito. El primer día cuesta; el décimo, presume."]})

card("mayor-16", ["cambio repentino", "revelación", "derrumbe", "liberación"],
 {"general": [
   "La Torre. Sí, ya. Yo tampoco la habría elegido. Pero tranquilidad: anuncia un cambio brusco que tira lo que estaba mal construido. Después del susto, se ve el cielo.",
   "Revelación repentina: algo sale a la luz y lo pone todo patas arriba. Es incómodo, pero libera. Como quitar una tirita de golpe."],
  "amor": ["Una verdad que sale a la luz o un cambio inesperado en lo sentimental. Lo que sobreviva a la Torre, aguanta lo que le echen."],
  "trabajo": ["Sacudida laboral: planes que cambian de golpe, reorganizaciones, sorpresas. Lo que se cae, se cae para dejar sitio a algo más sólido."],
  "dinero": ["Imprevistos que obligan a reorganizarte. Buen momento para reforzar cimientos y tener un colchón, por si acaso."],
  "salud": ["Una llamada de atención para cambiar de ritmo. Toca bajar revoluciones y priorizar el descanso."]},
 {"general": [
   "La Torre invertida tiembla pero no cae: un cambio que estás evitando o un susto que se queda en susto. Mejor reformar ahora que esperar al terremoto.",
   "Resistencia a lo inevitable. Si ves grietas, no las tapes con un cuadro."],
  "amor": ["Crisis que se pueden evitar si se habla a tiempo. O un cambio que da miedo pero ya toca."],
  "trabajo": ["Tensión acumulada que conviene soltar con cabeza antes de que reviente sola."],
  "dinero": ["Evitas mirar un problema. Mejor un pequeño ajuste hoy que un gran sobresalto mañana."],
  "salud": ["Avisos suaves del cuerpo que conviene escuchar. Descansar a tiempo evita los derrumbes."]})

card("mayor-17", ["esperanza", "inspiración", "serenidad", "renovación"],
 {"general": [
   "La Estrella trae esperanza: después de la tormenta, calma, inspiración y fe en el futuro. Todo apunta a que lo bueno está de camino.",
   "Carta de sanación y de sueños que se ven posibles. Brillas, y no es el brillo del móvil."],
  "amor": ["Ilusión renovada. Un amor sereno, sincero y bonito, o la esperanza de que llegue. Y llega, que lo dice la Estrella.",
           "Conexión con alguien que te hace sentir en paz. Mucho cielo estrellado y pocas discusiones."],
  "trabajo": ["Inspiración y creatividad. Tus ideas tienen luz propia; compártelas."],
  "dinero": ["Mejora poco a poco. Optimismo, pero con los pies en la tierra y la mirada en las estrellas."],
  "salud": ["Renovación y bienestar. Agua, descanso y aire libre: la Estrella es muy de spa."]},
 {"general": [
   "La Estrella invertida tiene la luz atenuada: desánimo, falta de fe o sensación de que nada brilla. Pero la estrella sigue ahí, aunque haya nubes.",
   "Te cuesta creer en ti. Recuerda una cosa que hayas hecho bien esta semana. ¿Ves? Ya brilla un poco."],
  "amor": ["Desilusión o expectativas demasiado altas. Baja las estrellas un palmo y verás que siguen siendo bonitas."],
  "trabajo": ["Falta de inspiración. No te fuerces: la musa llega cuando no la persigues."],
  "dinero": ["Pesimismo económico que nubla. Mira los números reales: suelen ser menos dramáticos que la imaginación."],
  "salud": ["Bajón de ánimo y energía. Pequeños placeres y rutinas suaves para recargar."]})

card("mayor-18", ["intuición", "incertidumbre", "sueños", "ilusiones"],
 {"general": [
   "La Luna lo envuelve todo en niebla: intuición, sueños y cosas que no son lo que parecen. Camina despacio y fíate de tu olfato.",
   "Carta del inconsciente. Hay miedos que hacen mucho ruido y luego son gatos en el tejado."],
  "amor": ["Sentimientos confusos o alguien que no muestra todas sus cartas. No te montes películas: espera a que amanezca para ver claro."],
  "trabajo": ["Información poco clara o ambiente raro. Observa, pregunta y no firmes nada a la luz de una vela."],
  "dinero": ["No te fíes de lo que brilla demasiado. Comprueba bien antes de dar nada por hecho."],
  "salud": ["Descanso y sueño, prioridad. Si das muchas vueltas en la cama, rutinas de noche más tranquilas."]},
 {"general": [
   "La Luna invertida empieza a despejar la niebla: los miedos se aclaran y las mentiras se caen solas. Amanece.",
   "Lo que te inquietaba resulta ser menos grave de lo que parecía. Era una farola, no un fantasma."],
  "amor": ["Se aclaran malentendidos. Lo que te rondaba la cabeza encuentra explicación, y suele ser más sencilla."],
  "trabajo": ["Sale a la luz lo que no estaba claro. Ahora sí puedes decidir con datos."],
  "dinero": ["Claridad en las cuentas. Lo que no entendías empieza a cuadrar."],
  "salud": ["Mejora el descanso y se calman las preocupaciones. A dormir como un lirón."]})

card("mayor-19", ["alegría", "éxito", "vitalidad", "claridad"],
 {"general": [
   "El Sol. Pues ya está, ya lo tienes: alegría, éxito y claridad. Es de las mejores cartas de la baraja. Ponte las gafas de sol, que esto deslumbra.",
   "Todo se ve claro y luminoso. Optimismo, energía y logros que se celebran con terraza."],
  "amor": ["Felicidad compartida, amor sincero y momentos para enmarcar. Si hay dudas, el Sol las derrite.",
           "Relaciones alegres y sin sombras. Planes al aire libre y risas de las buenas."],
  "trabajo": ["Éxito y reconocimiento. Lo que hagas brilla, y además se nota."],
  "dinero": ["Buena racha y tranquilidad. Disfruta con alegría y un pelín de sentido común."],
  "salud": ["Vitalidad a tope. Aire libre, luz natural y movimiento: el Sol receta vitamina D."]},
 {"general": [
   "El Sol invertido sigue siendo el Sol, solo que con alguna nube. Alegrías a medias, o exceso de confianza que deslumbra.",
   "Te cuesta ver lo bueno que tienes delante. Asómate a la ventana, que hace bueno."],
  "amor": ["Pequeñas nubes en un cielo despejado. Nada que una conversación y un helado no arreglen."],
  "trabajo": ["Éxito que se retrasa un poco o falta de reconocimiento. Llegará; el Sol siempre sale."],
  "dinero": ["Optimismo excesivo. Disfruta, pero sin pensar que la racha es eterna."],
  "salud": ["Energía algo baja. Más luz, más aire y menos sofá en penumbra."]})

card("mayor-20", ["renacer", "llamada", "balance", "despertar"],
 {"general": [
   "El Juicio toca la trompeta: despertar, balance y segundas oportunidades. Es hora de mirar atrás, aprender y renacer.",
   "Una llamada que no puedes ignorar. Algo te pide que des un paso definitivo hacia quien quieres ser."],
  "amor": ["Reencuentros, reconciliaciones o entender por fin una relación del pasado. Página nueva con lo aprendido."],
  "trabajo": ["Evaluaciones, resultados y vocación. Lo que has hecho se valora; toca decidir el siguiente paso."],
  "dinero": ["Balance de cuentas y lecciones aprendidas. Haces las paces con tus números."],
  "salud": ["Renovación de energía y ganas de cuidarte mejor. Un despertar con alarma suave."]},
 {"general": [
   "El Juicio invertido no oye la trompeta o se tapa los oídos: dudas, autocrítica feroz o miedo a dar el paso.",
   "Juzgarte con dureza no ayuda. Aprende del pasado, pero no vivas en él."],
  "amor": ["Viejas historias que vuelven sin aportar nada nuevo. Escucha, pero no repitas."],
  "trabajo": ["Indecisión ante una oportunidad. La puerta no estará abierta eternamente."],
  "dinero": ["Errores pasados que pesan. Aprende la lección y sigue, sin fustigarte."],
  "salud": ["Te cuesta arrancar con lo que sabes que te sienta bien. Empieza por lo más fácil."]})

card("mayor-21", ["culminación", "logro", "plenitud", "viaje"],
 {"general": [
   "El Mundo cierra el círculo: culminación, logro y plenitud. Algo importante se completa, y además te queda bien.",
   "Final feliz de un ciclo y viajes en el horizonte. El mundo, literalmente, a tus pies."],
  "amor": ["Plenitud sentimental. Relaciones que alcanzan su mejor momento o una sensación de plenitud que te sienta de maravilla."],
  "trabajo": ["Proyectos que se terminan con éxito, metas cumplidas y quizá horizontes internacionales."],
  "dinero": ["Estabilidad y sensación de objetivo cumplido. Celebra con mesura."],
  "salud": ["Bienestar general y equilibrio. Cuerpo y mente bien avenidos."]},
 {"general": [
   "El Mundo invertido se queda a un pasito: algo casi terminado que no acaba de cerrarse. Falta la guinda.",
   "Proyectos a medias o sensación de no llegar nunca. Tranquilidad: te queda el último empujón."],
  "amor": ["Una relación que no termina de cerrar un ciclo, o falta de compromiso para el siguiente paso."],
  "trabajo": ["Retrasos al final del camino. Remata los flecos y llegarás."],
  "dinero": ["Objetivos que se resisten. Revisa lo que falta y ve a por ello sin prisa."],
  "salud": ["Te falta un poco de constancia para sentirte del todo bien. Ya casi."]})
