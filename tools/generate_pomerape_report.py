from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
OUT_DIR.mkdir(exist_ok=True)
OUT_FILE = OUT_DIR / "Informe_funcionamiento_Pomerape.docx"

TEAL = "087F83"
TEAL_DARK = "07555B"
TEAL_LIGHT = "EAF5F4"
INK = "17252B"
GRAY = "586A70"
LIGHT_GRAY = "D5DEE0"
PALE_GRAY = "F4F7F7"
WHITE = "FFFFFF"
AMBER = "C17A16"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color=LIGHT_GRAY, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=90, start=100, bottom=90, end=100):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + margin))
        if node is None:
            node = OxmlElement("w:" + margin)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)


def keep_with_next(paragraph):
    paragraph.paragraph_format.keep_with_next = True


def set_font(run, name="Aptos", size=None, bold=None, color=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    return run


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)
    set_font(run, size=8, color=GRAY)


def add_footer(section):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(3)
    r = p.add_run("POMERAPE  |  INFORME DE FUNCIONAMIENTO")
    set_font(r, size=7.5, bold=True, color=TEAL_DARK)
    tab_stops = p.paragraph_format.tab_stops
    tab_stops.add_tab_stop(Cm(16.4))
    p.add_run("\t")
    r = p.add_run("17 OCT 2026  |  ")
    set_font(r, size=7.5, color=GRAY)
    add_page_number(p)


def add_rule(doc, color=TEAL, size=12, space_after=8):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p_pr = p._p.get_or_add_pPr()
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    borders.append(bottom)
    p_pr.append(borders)


def add_label(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text.upper())
    set_font(r, size=8, bold=True, color=TEAL)
    r.font.letter_spacing = Pt(1.1) if hasattr(r.font, "letter_spacing") else None
    return p


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    keep_with_next(p)
    return p


def add_body(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.line_spacing = 1.12
    if bold_lead and text.startswith(bold_lead):
        set_font(p.add_run(bold_lead), size=9.5, bold=True, color=INK)
        set_font(p.add_run(text[len(bold_lead):]), size=9.5, color=INK)
    else:
        set_font(p.add_run(text), size=9.5, color=INK)
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Cm(0.55)
        p.paragraph_format.first_line_indent = Cm(-0.25)
        p.paragraph_format.space_after = Pt(4)
        set_font(p.add_run(item), size=9.2, color=INK)


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        p.paragraph_format.left_indent = Cm(0.65)
        p.paragraph_format.first_line_indent = Cm(-0.35)
        p.paragraph_format.space_after = Pt(5)
        set_font(p.add_run(item), size=9.2, color=INK)


def add_table(doc, headers, rows, widths=None, font_size=8.2):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"
    header = table.rows[0]
    set_repeat_table_header(header)
    for i, text in enumerate(headers):
        cell = header.cells[i]
        if widths:
            cell.width = Cm(widths[i])
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_shading(cell, TEAL_DARK)
        set_cell_border(cell, TEAL_DARK)
        set_cell_margins(cell, 110, 100, 110, 100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        set_font(p.add_run(text), size=7.6, bold=True, color=WHITE)
    for row_index, row_values in enumerate(rows):
        row = table.add_row()
        set_cant_split(row)
        for i, value in enumerate(row_values):
            cell = row.cells[i]
            if widths:
                cell.width = Cm(widths[i])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            set_cell_shading(cell, PALE_GRAY if row_index % 2 else WHITE)
            set_cell_border(cell)
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            set_font(p.add_run(str(value)), size=font_size, color=INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_key_value_table(doc, rows):
    table = doc.add_table(rows=0, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"
    for label, value in rows:
        row = table.add_row()
        set_cant_split(row)
        row.cells[0].width = Cm(4.4)
        row.cells[1].width = Cm(12.0)
        for cell in row.cells:
            set_cell_border(cell)
            set_cell_margins(cell, 100, 120, 100, 120)
        set_cell_shading(row.cells[0], TEAL_LIGHT)
        set_font(row.cells[0].paragraphs[0].add_run(label), size=8.3, bold=True, color=TEAL_DARK)
        set_font(row.cells[1].paragraphs[0].add_run(value), size=8.6, color=INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def add_page_break(doc):
    doc.add_page_break()


doc = Document()
section = doc.sections[0]
section.top_margin = Cm(1.8)
section.bottom_margin = Cm(1.7)
section.left_margin = Cm(2.0)
section.right_margin = Cm(2.0)
section.header_distance = Cm(0.7)
section.footer_distance = Cm(0.7)
add_footer(section)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Aptos"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
normal.font.size = Pt(9.5)
normal.font.color.rgb = RGBColor.from_string(INK)
normal.paragraph_format.space_after = Pt(6)

title_style = styles["Title"]
title_style.font.name = "Aptos Display"
title_style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
title_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
title_style.font.size = Pt(30)
title_style.font.bold = True
title_style.font.color.rgb = RGBColor.from_string(INK)

for style_name, size, color, before, after in (
    ("Heading 1", 19, INK, 10, 7),
    ("Heading 2", 13.5, INK, 9, 5),
    ("Heading 3", 10.5, TEAL_DARK, 7, 4),
):
    style = styles[style_name]
    style.font.name = "Aptos Display"
    style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor.from_string(color)
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.keep_with_next = True

# Cover
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(30)
r = p.add_run("POMERAPE")
set_font(r, name="Aptos Display", size=13, bold=True, color=TEAL)
add_rule(doc, TEAL, 18, 72)

p = doc.add_paragraph(style="Title")
p.paragraph_format.space_after = Pt(14)
p.add_run("Informe de funcionamiento de la plataforma Pomerape")

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(26)
set_font(p.add_run("Arquitectura funcional, flujo de decisión pluvial y guía operativa"), name="Aptos Display", size=16, color=TEAL_DARK)

add_key_value_table(doc, [
    ("Versión del documento", "1.0"),
    ("Fecha", "17 de octubre de 2026"),
    ("Producto", "Pomerape · Plataforma pluvial"),
    ("Alcance", "Aplicación web Angular ejecutada sin backend"),
    ("Áreas configuradas", "Arica, Talcahuano, Belém y Quibdó"),
    ("Estado", "Prototipo funcional para demostración y evaluación institucional"),
])

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(35)
p.paragraph_format.space_after = Pt(8)
set_font(p.add_run("Propósito del documento"), size=10, bold=True, color=TEAL_DARK)
add_body(doc, "Este informe explica cómo funciona la plataforma completa, qué información utiliza, cómo convierte un pronóstico de lluvia en una decisión territorial y cuáles son sus límites técnicos actuales. Está dirigido a equipos municipales, profesionales de planificación, responsables de infraestructura y evaluadores de la solución.")

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(22)
set_font(p.add_run("Documento interno de trabajo"), size=8, bold=True, color=AMBER)

add_page_break(doc)

# Contents and executive summary
add_label(doc, "Contenido")
add_heading(doc, "Estructura del informe", 1)
toc_rows = [
    ("1", "Resumen ejecutivo", "Visión general, alcance y resultado del flujo"),
    ("2", "Funcionamiento integral", "Secuencia desde el pronóstico hasta el informe"),
    ("3", "Módulos de la plataforma", "Centro de control, mapa, plan, alertas e informes"),
    ("4", "Modelo de cálculo", "Riesgo, profundidad e impacto estimado"),
    ("5", "Arquitectura técnica", "Componentes, estado, mapas y persistencia"),
    ("6", "Operación y despliegue", "Uso diario, ejecución local y acceso público"),
    ("7", "Límites y evolución", "Brechas del prototipo y requisitos productivos"),
]
add_table(doc, ["N.º", "Sección", "Contenido"], toc_rows, [1.2, 5.0, 10.2], 8.4)

add_heading(doc, "Resumen ejecutivo", 1)
add_body(doc, "Pomerape organiza en un mismo flujo el pronóstico de lluvia, la lectura topográfica, la capacidad de drenaje y la selección de infraestructura verde. El usuario elige una fecha, revisa las zonas donde el agua podría concentrarse, selecciona uno o más parques de absorción y compara el escenario actual con el escenario intervenido.")
add_body(doc, "La versión actual funciona completamente en el navegador. Angular gestiona la interfaz y el estado; Leaflet representa las capas territoriales; los datos de cada localidad se cargan desde archivos del proyecto; y el plan seleccionado se guarda en localStorage. No existe una API de negocio, base de datos, autenticación ni sincronización entre usuarios.")
add_body(doc, "Por este motivo, los resultados deben entenderse como una herramienta de apoyo conceptual y demostrativo. La ponderación del riesgo, la profundidad proyectada, los caudales, costos y reducciones no reemplazan un estudio hidrológico, hidráulico, geotécnico o presupuestario validado.")

add_heading(doc, "Resultado que entrega la plataforma", 2)
add_bullets(doc, [
    "Una lectura priorizada de zonas expuestas para una fecha y precipitación seleccionadas.",
    "Una explicación visible del riesgo basada en topografía, pronóstico y drenaje.",
    "Una cartera local de parques de absorción, biozanjas y áreas de biorretención.",
    "Una comparación antes y después con agua acumulada, caudal máximo, profundidad y tiempo de evacuación.",
    "Un plan guardado en el dispositivo y un informe institucional imprimible en PDF desde el navegador.",
])

add_page_break(doc)

# Workflow
add_label(doc, "Funcionamiento integral")
add_heading(doc, "Flujo de decisión de extremo a extremo", 1)
add_body(doc, "La lógica principal conecta cuatro decisiones consecutivas. Cada etapa alimenta la siguiente y conserva el contexto del área seleccionada.")

workflow_rows = [
    ("1", "Seleccionar área y día", "El usuario escoge una localidad y uno de los cinco escenarios de lluvia.", "Área, fecha, probabilidad y milímetros."),
    ("2", "Calcular riesgo territorial", "La aplicación combina topografía, intensidad de lluvia y condición del drenaje.", "Puntaje de 0 a 100, nivel de riesgo y profundidad estimada."),
    ("3", "Evaluar intervenciones", "Se seleccionan parques y se comparan alternativas por superficie, costo, reducción y factibilidad.", "Portafolio de soluciones elegidas."),
    ("4", "Comparar impacto", "La aplicación recalcula agua acumulada, caudal, profundidad y evacuación.", "Escenario actual frente a escenario con intervención."),
    ("5", "Guardar y documentar", "El plan se almacena en el navegador y el informe se imprime como PDF.", "Registro local e informe institucional."),
]
add_table(doc, ["Paso", "Decisión", "Qué hace la plataforma", "Salida"], workflow_rows, [1.1, 3.4, 7.1, 4.8], 7.9)

add_heading(doc, "Relación entre módulos", 2)
add_body(doc, "El Centro de control resume la situación y conduce al Mapa de decisión. El mapa produce la selección territorial y entrega parámetros al Plan de intervención mediante la URL. El plan desarrolla la alternativa y permite volver al mapa para comparar. El módulo de Informes consolida los datos del área, las zonas, los tramos de drenaje y las intervenciones. Las Alertas están disponibles desde el encabezado para seguimiento operativo.")

add_heading(doc, "Áreas de operación", 2)
area_rows = [
    ("Arica, Chile", "Datos base completos", "Mapa topográfico local y cartera de tres intervenciones."),
    ("Talcahuano, Chile", "Datos base completos", "Capas territoriales y alternativas específicas de la comuna."),
    ("Belém, Brasil", "Datos base completos", "Zonas, drenaje y parques adaptados a Cidade Velha, Terra Firme y Marco."),
    ("Quibdó, Colombia", "Cobertura parcial", "El mapa de decisión incluye zonas y alternativas propias; el resto del sistema requiere completar un conjunto de datos integral."),
]
add_table(doc, ["Área", "Cobertura actual", "Comportamiento"], area_rows, [4.0, 3.2, 9.2], 8.1)

add_page_break(doc)

# Modules 1
add_label(doc, "Módulos de la plataforma")
add_heading(doc, "Centro de control", 1)
add_body(doc, "El Centro de control es la entrada operativa. Presenta el próximo evento de lluvia, los indicadores generales, el mapa territorial y las alertas prioritarias. Su objetivo es responder con rapidez tres preguntas: qué evento se aproxima, dónde podría acumularse el agua y qué acción requiere revisión.")
add_table(doc, ["Elemento", "Función", "Acción disponible"], [
    ("Banner del próximo evento", "Muestra 38 mm previstos y el riesgo integrado de la zona prioritaria.", "Abrir el análisis completo."),
    ("Indicadores", "Resume lluvia, zonas evaluadas, alternativas, riesgo alto, obstrucciones y alertas.", "Entender el estado general."),
    ("Mapa territorial", "Representa profundidad proyectada, rutas de escurrimiento y zonas prioritarias.", "Ir al mapa de decisión."),
    ("Alertas prioritarias", "Lista incidencias abiertas por severidad y ubicación.", "Abrir la bandeja completa."),
], [4.0, 8.0, 4.4], 8.0)

add_heading(doc, "Mapa de decisión pluvial", 1)
add_body(doc, "El Mapa de decisión es el núcleo funcional. La pantalla mantiene visible el pronóstico, el mapa y el panel de explicación para que la recomendación pueda revisarse sin cambiar de módulo.")
add_numbered(doc, [
    "Seleccionar uno de los cinco días disponibles. Cada tarjeta incluye precipitación en milímetros, probabilidad y condición de lluvia.",
    "Cambiar la superficie entre Riesgo y Altura para revisar susceptibilidad o relieve.",
    "Seleccionar una zona del mapa. El panel lateral actualiza el puntaje, las causas y la intervención recomendada.",
    "Añadir uno o más parques a la comparación. El modo Con parques se habilita cuando existe una selección.",
    "Comparar los indicadores actuales con los proyectados y guardar el plan en el dispositivo.",
    "Abrir el Plan de intervención con la zona, lluvia, día e intervención enviados como parámetros de navegación.",
])

add_heading(doc, "Lectura visual del mapa", 2)
add_table(doc, ["Símbolo o capa", "Significado operativo"], [
    ("Profundidad proyectada", "Representa la altura máxima estimada de agua para el evento seleccionado."),
    ("Ruta de escurrimiento", "Indica el recorrido esperado del agua según la pendiente y la geometría representada."),
    ("Zona prioritaria", "Delimita un polígono evaluado y coloreado según su nivel de riesgo."),
    ("Parque de absorción", "Ubica una alternativa de captación, retención e infiltración que puede incorporarse al plan."),
    ("Actual / Con parques", "Permite comparar la situación base y el efecto agregado de las intervenciones seleccionadas."),
], [5.0, 11.4], 8.2)

add_page_break(doc)

# Modules 2
add_heading(doc, "Plan de intervención", 1)
add_body(doc, "Este módulo desarrolla la alternativa recomendada. Recibe el contexto desde el Mapa de decisión y permite ajustar zona de análisis, tipo de intervención, superficie y presupuesto. La evaluación devuelve un puntaje de factibilidad y una proyección antes y después.")
add_table(doc, ["Entrada", "Uso", "Resultado asociado"], [
    ("Zona", "Selecciona el sector donde se evaluará la solución.", "Riesgo territorial y alternativa aplicable."),
    ("Tipo de intervención", "Define jardín de lluvia, biozanja u otra solución disponible.", "Capacidad de captación y función hidráulica."),
    ("Superficie", "Dimensiona el área preliminar de intervención.", "Volumen retenido y reducción esperada."),
    ("Presupuesto", "Establece una referencia económica para la alternativa.", "Costo y factibilidad preliminar."),
], [3.6, 6.2, 6.6], 8.2)
add_body(doc, "La vista incluye una representación didáctica del recorrido del agua: precipitación, captación, retención, infiltración y liberación controlada. También muestra la cartera de alternativas de la localidad para evitar que una sola solución se interprete como respuesta universal.")

add_heading(doc, "Alertas e incidencias", 1)
add_body(doc, "La bandeja de Alertas reúne los eventos abiertos. El usuario puede filtrar por activas, todas, críticas o cerradas; abrir el detalle; asignar una alerta; y cerrar una incidencia. Las acciones modifican el estado en memoria durante la sesión.")
add_table(doc, ["Estado", "Interpretación"], [
    ("Nueva", "Alerta creada y pendiente de confirmación."),
    ("Confirmada", "La incidencia fue reconocida y debe gestionarse."),
    ("Asignada", "Existe un responsable operativo asociado."),
    ("Cerrada", "La acción fue registrada como finalizada dentro de la sesión."),
], [4.0, 12.4], 8.4)

add_heading(doc, "Informes", 1)
add_body(doc, "El módulo de Informes consolida el diagnóstico de la localidad en un documento institucional. Incluye resumen ejecutivo, zonas evaluadas, diagnóstico de drenaje, parques propuestos, hoja de ruta e indicadores. El botón de generación activa la vista de impresión del navegador para guardar el resultado en PDF.")
add_bullets(doc, [
    "El informe se adapta al área seleccionada y asigna un código documental por localidad.",
    "Las tablas se construyen con los datos cargados en el servicio central.",
    "La generación no crea un archivo en un servidor; utiliza window.print y depende de la configuración de impresión del navegador.",
])

add_page_break(doc)

# Calculations
add_label(doc, "Modelo de cálculo")
add_heading(doc, "Riesgo territorial integrado", 1)
add_body(doc, "El mapa calcula un puntaje de 0 a 100 para cada zona. En la versión actual, la fórmula pondera tres factores visibles en el panel lateral.")

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(8)
p.paragraph_format.space_after = Pt(10)
set_font(p.add_run("Riesgo = 0,45 × Topografía + 0,35 × Pronóstico + 0,20 × Drenaje"), name="Aptos Display", size=14, bold=True, color=TEAL_DARK)

add_table(doc, ["Factor", "Peso", "Base de cálculo en la aplicación"], [
    ("Topografía", "45 %", "Puntaje asociado a la zona y a su susceptibilidad por cota y convergencia del escurrimiento."),
    ("Pronóstico", "35 %", "Lluvia seleccionada normalizada respecto de una referencia de 45 mm y limitada a 100."),
    ("Drenaje", "20 %", "Condición y confianza del tramo asociado a la zona; si no existe coincidencia se utiliza un valor de referencia."),
], [3.5, 2.0, 10.9], 8.3)
add_body(doc, "La aplicación ajusta el comportamiento de eventos de baja intensidad para evitar que una lluvia pequeña se comunique automáticamente como emergencia. Aun así, una zona puede conservar un riesgo estructural medio por su topografía y drenaje. Esto distingue la amenaza meteorológica del día de la susceptibilidad permanente del territorio.")

add_heading(doc, "Proyecciones del escenario", 1)
add_table(doc, ["Indicador", "Lógica actual", "Uso en la decisión"], [
    ("Agua acumulada", "Estimación derivada de precipitación, escorrentía y zona seleccionada.", "Dimensionar la magnitud relativa del evento."),
    ("Profundidad máxima", "Proyección territorial ajustada por lluvia, topografía y presión del drenaje.", "Comunicar la severidad esperada en centímetros."),
    ("Caudal máximo", "Función de la lluvia seleccionada y la escorrentía de la zona.", "Comparar exigencia hidráulica antes y después."),
    ("Tiempo de evacuación", "Estimación de duración para liberar el volumen acumulado.", "Comparar rapidez de recuperación."),
    ("Impacto de parques", "Suma acotada de las reducciones declaradas por las intervenciones elegidas.", "Proyectar el beneficio conjunto sin duplicar efectos indefinidamente."),
], [3.4, 7.0, 6.0], 7.9)

add_heading(doc, "Interpretación correcta", 2)
add_body(doc, "Los cálculos permiten ordenar alternativas y explicar el razonamiento de la interfaz. No representan una simulación hidrodinámica calibrada. Antes de utilizar los resultados para diseño, licitación, inversión o seguridad pública, se deben validar el modelo digital de elevación, las curvas intensidad duración frecuencia, la red de drenaje, la capacidad de infiltración, los niveles de descarga y los costos locales.")

add_page_break(doc)

# Architecture
add_label(doc, "Arquitectura técnica")
add_heading(doc, "Estructura de la aplicación", 1)
add_body(doc, "Pomerape está implementada como una aplicación Angular de componentes independientes. El navegador ejecuta la lógica, mantiene el estado y representa los mapas sin depender de un servidor de aplicación.")
add_table(doc, ["Capa", "Implementación", "Responsabilidad"], [
    ("Navegación", "Angular Router", "Carga diferida de páginas, redirección inicial y títulos del navegador."),
    ("Interfaz", "Angular 19 y componentes standalone", "Pantallas, formularios, filtros y comparación de escenarios."),
    ("Estado", "Signals y computed de Angular", "Área activa, alertas, zonas, tramos, intervenciones y métricas derivadas."),
    ("Cartografía", "Leaflet 1.9 y capas propias", "Mapa base, polígonos, rutas, alternativas y superficies de riesgo o altura."),
    ("Datos", "demo-data.ts y estructuras locales", "Conjuntos de datos por localidad utilizados por el prototipo."),
    ("Persistencia", "localStorage", "Plan seleccionado en el Mapa de decisión."),
    ("Informe", "HTML de impresión y window.print", "Generación de PDF mediante el diálogo del navegador."),
], [3.0, 5.0, 8.4], 8.0)

add_heading(doc, "Archivos principales", 2)
add_table(doc, ["Archivo", "Función"], [
    ("src/app/app.component.ts", "Estructura global, navegación, reloj, alertas activas y selector de área."),
    ("src/app/app.routes.ts", "Definición de rutas y carga diferida de las páginas."),
    ("src/app/core/hydro.service.ts", "Estado central, cambio de localidad, métricas y acciones sobre datos."),
    ("src/app/core/demo-data.ts", "Datos locales de zonas, drenaje, alertas, intervenciones y escenarios."),
    ("src/app/shared/hydro-map.component.ts", "Representación cartográfica compartida y capas territoriales."),
    ("src/app/pages/geo-map.component.ts", "Pronóstico, riesgo, comparación, selección y guardado del plan."),
    ("src/app/pages/green-infrastructure.component.ts", "Diseño y evaluación preliminar de la intervención."),
    ("src/app/pages/reports.component.ts", "Informe en pantalla y formato institucional de impresión."),
], [7.0, 9.4], 8.0)

add_heading(doc, "Rutas visibles y rutas de soporte", 2)
add_table(doc, ["Ruta", "Nombre", "Estado en la navegación"], [
    ("/dashboard", "Centro de control", "Principal"),
    ("/mapa", "Mapa de decisión", "Principal"),
    ("/infraestructura-verde", "Plan de intervención", "Principal"),
    ("/informes", "Informes", "Principal"),
    ("/alertas", "Alertas e incidencias", "Acceso desde el encabezado y enlaces internos"),
    ("/diagnosticos, /lluvia, /mission-control", "Módulos de soporte heredados", "Existen en el enrutador, pero no forman parte del menú principal actual"),
], [5.2, 5.3, 5.9], 8.1)

add_page_break(doc)

# Data flow and persistence
add_heading(doc, "Flujo de datos y persistencia", 1)
add_body(doc, "El selector de área llama a HydroService.setDemoArea. El servicio reemplaza los conjuntos locales y actualiza la fecha de modificación. Los componentes consumen las señales y recalculan sus valores derivados. Cuando el usuario cambia de día, zona o parque, solo cambia el estado del navegador.")
add_table(doc, ["Acción del usuario", "Cambio interno", "Persistencia"], [
    ("Cambiar área", "Sustituye zonas, drenaje, alertas e intervenciones del servicio.", "Solo durante la ejecución actual."),
    ("Cambiar día de lluvia", "Recalcula pronóstico, riesgo, profundidad y comparación.", "Solo durante la ejecución actual."),
    ("Seleccionar parque", "Actualiza la cartera de intervenciones incluidas.", "Solo durante la ejecución hasta guardar."),
    ("Guardar plan local", "Serializa área, parques, pronóstico y fecha.", "localStorage del navegador y dispositivo actuales."),
    ("Asignar o cerrar alerta", "Modifica el arreglo de alertas en memoria.", "Se pierde al recargar la aplicación."),
    ("Generar informe", "Activa una plantilla de impresión de cuatro páginas.", "El usuario decide si guarda un PDF local."),
], [4.4, 7.3, 4.7], 8.0)

add_heading(doc, "Dependencias y ejecución", 1)
add_key_value_table(doc, [
    ("Framework", "Angular 19.2"),
    ("Lenguaje", "TypeScript 5.7"),
    ("Cartografía", "Leaflet 1.9.4 y leaflet.heat"),
    ("Gráficos", "ECharts 6.1"),
    ("Compilación", "Angular CLI 19.2"),
    ("Salida", "dist/rally/browser"),
])
add_body(doc, "La configuración actual permite desarrollar con ng serve, compilar con ng build y exponer una instancia local mediante ngrok. El acceso público depende de que el servidor local y el túnel permanezcan ejecutándose en el mismo equipo.")

add_heading(doc, "Seguridad y privacidad actuales", 2)
add_bullets(doc, [
    "No existe autenticación, autorización por rol ni sesión de usuario.",
    "El prototipo no envía el plan guardado a un servidor propio.",
    "El enlace ngrok hace visible la aplicación mientras el túnel está activo y debe administrarse como acceso temporal.",
    "No hay auditoría persistente de cambios, trazabilidad de alertas ni cifrado de datos de negocio en una base de datos.",
])

add_page_break(doc)

# Operating guide
add_label(doc, "Guía operativa")
add_heading(doc, "Uso diario recomendado", 1)
add_numbered(doc, [
    "Abrir Pomerape y comprobar el área de operación en el encabezado.",
    "Revisar el Centro de control para identificar el próximo evento y las alertas abiertas.",
    "Abrir el Mapa de decisión y seleccionar el día que se desea evaluar.",
    "Examinar la vista de Riesgo y contrastarla con la vista de Altura.",
    "Seleccionar cada zona prioritaria y revisar las causas que explican el puntaje.",
    "Añadir las alternativas pertinentes, activar Con parques y comparar el impacto esperado.",
    "Abrir el Plan de intervención para ajustar superficie, tipo y presupuesto.",
    "Guardar el plan local y generar el informe institucional desde Informes.",
])

add_heading(doc, "Ejecución local", 1)
add_table(doc, ["Paso", "Comando", "Resultado esperado"], [
    ("1", "npm install", "Instala las dependencias del proyecto."),
    ("2", "npm start", "Inicia el servidor de desarrollo de Angular."),
    ("3", "Abrir la URL indicada por la terminal", "Carga la aplicación en el navegador."),
    ("4", "npm run build", "Genera la versión compilada en dist/rally/browser."),
], [1.1, 5.2, 10.1], 8.4)

add_heading(doc, "Publicación temporal con ngrok", 1)
add_body(doc, "Para una demostración pública, primero debe existir un servicio escuchando en el puerto configurado. Si Angular usa un puerto distinto de 4200, el túnel debe apuntar al puerto real. En la configuración utilizada para la demostración, ngrok reenvía la dirección pública hacia http://localhost:4200.")
add_numbered(doc, [
    "Mantener abierta la terminal que sirve la aplicación.",
    "Abrir una segunda terminal y ejecutar ngrok http 4200.",
    "Compartir la URL HTTPS mostrada como Forwarding.",
    "No iniciar un segundo túnel con el mismo dominio mientras el primero siga activo.",
])

add_heading(doc, "Comprobaciones antes de una demostración", 2)
add_bullets(doc, [
    "Las cuatro áreas cambian correctamente desde el encabezado.",
    "Los cinco días modifican milímetros, probabilidad, riesgo y profundidad.",
    "Los polígonos y parques permanecen sobre tierra y dentro del área representada.",
    "La comparación Con parques se activa únicamente después de seleccionar una alternativa.",
    "El plan se guarda, se puede limpiar y el informe se imprime sin elementos de navegación.",
    "El enlace público responde y el servidor local continúa activo.",
])

add_page_break(doc)

# Limitations and roadmap
add_label(doc, "Límites y evolución")
add_heading(doc, "Alcance real del prototipo", 1)
add_table(doc, ["Tema", "Estado actual", "Implicación"], [
    ("Pronóstico", "Cinco escenarios definidos en el frontend.", "No consulta un proveedor meteorológico en tiempo real."),
    ("Topografía", "Capas y superficies preparadas para demostración.", "No descarga ni procesa un modelo digital de elevación oficial en cada consulta."),
    ("Hidráulica", "Fórmulas conceptuales y ponderaciones internas.", "No sustituye SWMM, HEC-RAS u otro modelo calibrado."),
    ("Datos", "Archivos TypeScript locales.", "No hay base de datos, historial ni integración GIS corporativa."),
    ("Colaboración", "Estado en memoria y localStorage.", "Dos usuarios no comparten planes ni cambios."),
    ("Alertas", "Gestión interactiva en sesión.", "Las asignaciones y cierres se pierden al recargar."),
    ("Quibdó", "Capa de decisión específica con cobertura parcial.", "Se debe completar la consistencia de datos entre todos los módulos."),
], [3.0, 6.2, 7.2], 7.9)

add_heading(doc, "Requisitos para una versión productiva", 1)
add_table(doc, ["Prioridad", "Trabajo requerido", "Resultado"], [
    ("Alta", "Backend, base de datos y API versionada.", "Persistencia, colaboración, auditoría y continuidad operativa."),
    ("Alta", "Integración con pronóstico oficial y observaciones meteorológicas.", "Escenarios actualizados, trazables y con hora de emisión."),
    ("Alta", "Modelo digital de elevación, red de drenaje GIS y calibración hidráulica.", "Profundidades y caudales defendibles técnicamente."),
    ("Alta", "Autenticación, roles y registro de actividad.", "Control de acceso y responsabilidad institucional."),
    ("Media", "Servicio geoespacial para validar polígonos, cauces y uso de suelo.", "Ubicaciones consistentes y restricciones territoriales verificables."),
    ("Media", "Catálogo de costos, mantenimiento y vida útil por país.", "Evaluaciones económicas comparables y actualizables."),
    ("Media", "Pruebas automáticas, monitoreo y respaldo.", "Mayor estabilidad y detección temprana de fallas."),
], [2.0, 8.1, 6.3], 8.0)

add_heading(doc, "Criterios de aceptación recomendados", 2)
add_bullets(doc, [
    "Cada dato operativo debe mostrar fuente, fecha, unidad y nivel de confianza.",
    "Una misma localidad debe usar el mismo conjunto de zonas y drenaje en mapa, plan, alertas e informe.",
    "Los escenarios deben poder reproducirse con parámetros almacenados y una versión identificable del modelo.",
    "El informe debe diferenciar hechos observados, estimaciones del modelo y recomendaciones profesionales.",
    "Las decisiones que afecten inversión o seguridad deben requerir revisión técnica y aprobación institucional.",
])

add_page_break(doc)

# Closing and glossary
add_label(doc, "Cierre")
add_heading(doc, "Conclusión operativa", 1)
add_body(doc, "Pomerape ya demuestra un flujo coherente de apoyo a la decisión: presenta un evento de lluvia, identifica zonas potencialmente expuestas, explica los factores del riesgo, permite seleccionar infraestructura verde y compara el efecto esperado. La interfaz hace visible la relación entre pronóstico, territorio y solución.")
add_body(doc, "El siguiente salto no depende de agregar más pantallas. Depende de conectar la interfaz con fuentes oficiales, un modelo hidráulico validado y una capa de persistencia institucional. Esas integraciones permitirán que la misma experiencia pase de prototipo demostrativo a herramienta operativa trazable.")

add_heading(doc, "Glosario", 1)
add_table(doc, ["Término", "Definición en Pomerape"], [
    ("Escorrentía", "Fracción del agua de lluvia que circula sobre la superficie y converge hacia zonas bajas o drenajes."),
    ("Infraestructura verde", "Intervenciones vegetadas que captan, retienen, infiltran o liberan agua de forma controlada."),
    ("Parque de absorción", "Espacio público diseñado para recibir temporalmente escorrentía y reducir la presión sobre el drenaje."),
    ("Biozanja", "Corredor vegetado que desacelera, filtra e infiltra el agua a lo largo de un eje."),
    ("Biorretención", "Depresión vegetada con suelo filtrante y almacenamiento temporal."),
    ("Riesgo integrado", "Puntaje relativo que combina topografía, pronóstico y drenaje dentro del prototipo."),
    ("localStorage", "Almacenamiento del navegador que conserva el plan solo en el dispositivo y perfil actuales."),
], [4.0, 12.4], 8.2)

add_heading(doc, "Control documental", 1)
add_key_value_table(doc, [
    ("Título", "Informe de funcionamiento de la plataforma Pomerape"),
    ("Versión", "1.0"),
    ("Fecha de referencia", "17 de octubre de 2026"),
    ("Base revisada", "Código fuente disponible en el repositorio Rally"),
    ("Próxima revisión", "Después de integrar backend, datos oficiales o un nuevo modelo de riesgo"),
])

# Document metadata
props = doc.core_properties
props.title = "Informe de funcionamiento de la plataforma Pomerape"
props.subject = "Arquitectura funcional, flujo de decisión pluvial y guía operativa"
props.author = "Pomerape"
props.keywords = "Pomerape, gestión pluvial, infraestructura verde, Angular, Leaflet"
props.comments = "Documento generado a partir del código fuente vigente del proyecto Rally."

doc.save(OUT_FILE)
print(OUT_FILE)
