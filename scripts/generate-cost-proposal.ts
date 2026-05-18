import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  ImageRun,
  convertInchesToTwip,
  TableLayoutType,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const LOGO_PATH = path.resolve(process.cwd(), "public/images/logo_SIAE.png");
const LOGO_BUFFER = fs.readFileSync(LOGO_PATH);

// ── Color Palette ──
const C = {
  primary: "1B5E20",
  primaryLight: "4CAF50",
  secondary: "0D47A1",
  secondaryLight: "1976D2",
  accent: "FF6F00",
  accentDark: "E65100",
  dark: "212121",
  medium: "616161",
  light: "9E9E9E",
  white: "FFFFFF",
  greenBg: "E8F5E9",
  blueBg: "E3F2FD",
  grayBg: "F5F5F5",
  orangeBg: "FFF3E0",
  redText: "C62828",
  totalBg: "1B5E20",
  subtotalBg: "C8E6C9",
};

// ── Helpers ──
function p(
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    color?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    italic?: boolean;
    before?: number;
    after?: number;
  } = {}
): Paragraph {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        italics: opts.italic ?? false,
        size: opts.size ?? 22,
        color: opts.color || C.dark,
        font: "Calibri",
      }),
    ],
  });
}

function justified(text: string, before = 80, after = 80): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before, after },
    children: [
      new TextRun({ text, size: 22, color: C.dark, font: "Calibri" }),
    ],
  });
}

function sectionTitle(text: string, color = C.primary): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 500, after: 80 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 32,
          color,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: C.primaryLight,
          size: 18,
          font: "Calibri",
        }),
      ],
    }),
  ];
}

function subtitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text: `▸ ${text}`,
        bold: true,
        size: 26,
        color: C.secondary,
        font: "Calibri",
      }),
    ],
  });
}

function bullet(text: string, boldPrefix?: string): Paragraph {
  const children: TextRun[] = [];
  if (boldPrefix) {
    children.push(
      new TextRun({ text: `● ${boldPrefix}: `, bold: true, size: 22, color: C.primary, font: "Calibri" }),
      new TextRun({ text, size: 22, color: C.dark, font: "Calibri" })
    );
  } else {
    children.push(new TextRun({ text: `● ${text}`, size: 22, color: C.dark, font: "Calibri" }));
  }
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: convertInchesToTwip(0.4) },
    children,
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [] });
}

// ── Table helpers ──
function cell(
  text: string,
  opts: {
    bold?: boolean;
    color?: string;
    shading?: string;
    width?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
  } = {}
): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading
      ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading }
      : undefined,
    margins: {
      top: convertInchesToTwip(0.04),
      bottom: convertInchesToTwip(0.04),
      left: convertInchesToTwip(0.08),
      right: convertInchesToTwip(0.08),
    },
    children: [
      new Paragraph({
        alignment: opts.alignment || AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            size: opts.size ?? 20,
            color: opts.color || C.dark,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

function headerRow(texts: string[], widths: number[], color = C.secondary): TableRow {
  return new TableRow({
    children: texts.map((t, i) =>
      cell(t, { bold: true, color: C.white, shading: color, width: widths[i], alignment: i >= 2 ? AlignmentType.RIGHT : AlignmentType.LEFT })
    ),
  });
}

function dataRow(texts: string[], widths: number[], idx: number, opts?: { bold?: boolean; shading?: string; color?: string }): TableRow {
  const bg = opts?.shading || (idx % 2 === 0 ? C.grayBg : C.white);
  return new TableRow({
    children: texts.map((t, i) =>
      cell(t, {
        width: widths[i],
        alignment: i >= 2 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        shading: bg,
        bold: opts?.bold,
        color: opts?.color,
      })
    ),
  });
}

function subtotalRow(texts: string[], widths: number[]): TableRow {
  return new TableRow({
    children: texts.map((t, i) =>
      cell(t, {
        width: widths[i],
        alignment: i >= 2 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        shading: C.subtotalBg,
        bold: true,
        color: C.primary,
      })
    ),
  });
}

function totalRow(texts: string[], widths: number[]): TableRow {
  return new TableRow({
    children: texts.map((t, i) =>
      cell(t, {
        width: widths[i],
        alignment: i >= 2 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        shading: C.totalBg,
        bold: true,
        color: C.white,
        size: 22,
      })
    ),
  });
}

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: C.dark },
      },
    },
  },
  sections: [
    // ════════════════════════════════════════════════════
    // PORTADA
    // ════════════════════════════════════════════════════
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
        },
      },
      children: [
        emptyLine(), emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: LOGO_BUFFER,
              transformation: { width: 280, height: 123 },
              type: "png",
            }),
          ],
        }),
        emptyLine(),
        p("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", { color: C.primaryLight, size: 24, alignment: AlignmentType.CENTER }),
        emptyLine(),
        p("REPÚBLICA DE PANAMÁ", { bold: true, size: 28, color: C.medium, alignment: AlignmentType.CENTER }),
        emptyLine(),
        p("PROPUESTA DE COSTO", { bold: true, size: 52, color: C.primary, alignment: AlignmentType.CENTER }),
        p("OPERATIVO ANUAL", { bold: true, size: 52, color: C.primary, alignment: AlignmentType.CENTER }),
        emptyLine(),
        p("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", { color: C.primaryLight, size: 24, alignment: AlignmentType.CENTER }),
        emptyLine(),
        p("SIAE", { size: 40, bold: true, color: C.secondary, alignment: AlignmentType.CENTER }),
        p("Sistema Integral de Activos del Estado", { size: 28, color: C.secondary, alignment: AlignmentType.CENTER, italic: true }),
        p("Módulo: Administración de Residuos y Chatarra", { size: 22, color: C.medium, alignment: AlignmentType.CENTER, italic: true }),
        emptyLine(), emptyLine(),
        p("Infraestructura, Servicios y Recursos Humanos", { size: 24, color: C.medium, alignment: AlignmentType.CENTER }),
        emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        p("Documento de Propuesta Económica", { size: 22, color: C.medium, alignment: AlignmentType.CENTER }),
        p("Versión 1.0 — Marzo 2026", { size: 22, color: C.medium, alignment: AlignmentType.CENTER }),
        p("CONFIDENCIAL", { bold: true, size: 20, color: C.accent, alignment: AlignmentType.CENTER }),
      ],
    },

    // ════════════════════════════════════════════════════
    // CONTENIDO
    // ════════════════════════════════════════════════════
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9) },
        },
      },
      headers: {
        default: new Header({
          children: [
            p("Propuesta de Costo Operativo Anual — SIAE (Sistema Integral de Activos del Estado)", {
              italic: true, size: 16, color: C.light, alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            p("Confidencial — República de Panamá — Marzo 2026", {
              size: 16, color: C.light, alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: [
        // ── 1. RESUMEN EJECUTIVO ──
        ...sectionTitle("1. Resumen Ejecutivo"),
        justified(
          "El presente documento detalla la propuesta de costo operativo anualizado para SIAE — Sistema Integral de Activos del Estado, en su módulo de Administración de Residuos y Chatarra. Esta propuesta contempla todos los componentes necesarios para mantener la plataforma en operación continua en un ambiente de producción empresarial desplegado en Amazon Web Services (AWS), incluyendo servicios de infraestructura en la nube, servicios externos de terceros, herramientas de observabilidad y monitoreo, así como los recursos humanos dedicados al soporte y mantenimiento del sistema."
        ),
        emptyLine(),
        justified(
          "La infraestructura propuesta está diseñada para ofrecer alta disponibilidad, seguridad de nivel empresarial y capacidad de escalamiento según las necesidades del sistema, garantizando un servicio confiable para las instituciones gubernamentales de la República de Panamá."
        ),
        emptyLine(),

        // Tabla resumen rápido
        p("Resumen de Inversión Anual", { bold: true, size: 26, color: C.secondary, before: 200, after: 150 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["CATEGORÍA", "COSTO MENSUAL", "COSTO ANUAL"], [50, 25, 25]),
            dataRow(["Infraestructura AWS", "$306.00", "$3,672.00"], [50, 25, 25], 0),
            dataRow(["Servicios Externos (Google Maps, Email, Dominio)", "$44.17", "$530.00"], [50, 25, 25], 1),
            dataRow(["Observabilidad y Monitoreo (Recomendado)", "$26.00", "$312.00"], [50, 25, 25], 0),
            dataRow(["Recursos Humanos (2 personas)", "$2,500.00", "$30,000.00"], [50, 25, 25], 1),
            totalRow(["TOTAL ESTIMADO ANUAL", "$2,876.17", "$34,514.00"], [50, 25, 25]),
          ],
        }),
        emptyLine(),
        p("* Los montos están expresados en dólares estadounidenses (USD). Los costos de AWS y servicios pueden variar según el uso real.", {
          italic: true, size: 18, color: C.medium,
        }),

        // ── 2. INFRAESTRUCTURA AWS ──
        ...sectionTitle("2. Infraestructura en la Nube — Amazon Web Services (AWS)", C.secondary),
        justified(
          "La plataforma será desplegada en Amazon Web Services (AWS), el proveedor de servicios en la nube líder a nivel mundial, utilizado por gobiernos y empresas Fortune 500 en todo el mundo. La siguiente tabla detalla cada servicio de AWS requerido, su especificación técnica y costo estimado."
        ),
        emptyLine(),

        // ── Tabla AWS: Cómputo ──
        subtitle("Cómputo y Redes"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["SERVICIO AWS", "ESPECIFICACIÓN", "MENSUAL", "ANUAL"], [28, 37, 15, 20]),
            dataRow(["Amazon ECS (Fargate)", "2 tareas con 0.5 vCPU y 1 GB RAM cada una. Servicio de contenedores serverless que ejecuta la aplicación sin gestionar servidores.", "$36.00", "$432.00"], [28, 37, 15, 20], 0),
            dataRow(["Application Load Balancer", "1 balanceador de carga que distribuye el tráfico entre las tareas de la aplicación. Incluye unidades de capacidad (LCU).", "$25.00", "$300.00"], [28, 37, 15, 20], 1),
            dataRow(["NAT Gateway", "1 gateway para permitir que los contenedores en subredes privadas accedan a internet de forma segura (actualizaciones, APIs externas).", "$45.00", "$540.00"], [28, 37, 15, 20], 0),
            dataRow(["Amazon VPC", "Red privada virtual que aísla toda la infraestructura del sistema. Incluye subredes públicas y privadas.", "$0.00", "$0.00"], [28, 37, 15, 20], 1),
            subtotalRow(["SUBTOTAL CÓMPUTO Y REDES", "", "$106.00", "$1,272.00"], [28, 37, 15, 20]),
          ],
        }),
        emptyLine(),

        // ── Tabla AWS: Base de Datos ──
        subtitle("Base de Datos"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["SERVICIO AWS", "ESPECIFICACIÓN", "MENSUAL", "ANUAL"], [28, 37, 15, 20]),
            dataRow(["Amazon RDS PostgreSQL", "Instancia db.t3.medium (2 vCPU, 4 GB RAM) con despliegue Multi-AZ para alta disponibilidad. 50 GB de almacenamiento SSD.", "$140.00", "$1,680.00"], [28, 37, 15, 20], 0),
            dataRow(["Respaldos Automáticos RDS", "Retención de 7 días de respaldos automáticos con capacidad de restauración a cualquier punto en el tiempo (PITR). Incluido en RDS.", "$0.00", "$0.00"], [28, 37, 15, 20], 1),
            subtotalRow(["SUBTOTAL BASE DE DATOS", "", "$140.00", "$1,680.00"], [28, 37, 15, 20]),
          ],
        }),
        emptyLine(),

        // ── Tabla AWS: Almacenamiento y CDN ──
        subtitle("Almacenamiento y Distribución de Contenido"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["SERVICIO AWS", "ESPECIFICACIÓN", "MENSUAL", "ANUAL"], [28, 37, 15, 20]),
            dataRow(["Amazon S3", "Almacenamiento de documentos y fotografías. 100 GB estimados con clase de almacenamiento Standard. Durabilidad 99.999999999%.", "$5.00", "$60.00"], [28, 37, 15, 20], 0),
            dataRow(["Amazon CloudFront", "Red de distribución de contenido (CDN) global. 100 GB de transferencia mensual estimada para acelerar carga de la aplicación.", "$15.00", "$180.00"], [28, 37, 15, 20], 1),
            subtotalRow(["SUBTOTAL ALMACENAMIENTO Y CDN", "", "$20.00", "$240.00"], [28, 37, 15, 20]),
          ],
        }),
        emptyLine(),

        // ── Tabla AWS: Seguridad ──
        subtitle("Seguridad y Gestión de Secretos"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["SERVICIO AWS", "ESPECIFICACIÓN", "MENSUAL", "ANUAL"], [28, 37, 15, 20]),
            dataRow(["AWS WAF", "Firewall de aplicaciones web con reglas gestionadas de AWS para protección contra inyección SQL, XSS, bots y ataques DDoS.", "$15.00", "$180.00"], [28, 37, 15, 20], 0),
            dataRow(["AWS Secrets Manager", "Gestión segura de 5 secretos (credenciales de base de datos, API keys, tokens). Rotación automática disponible.", "$3.00", "$36.00"], [28, 37, 15, 20], 1),
            dataRow(["AWS Certificate Manager", "Certificados SSL/TLS gratuitos para cifrado HTTPS en todos los endpoints de la aplicación.", "$0.00", "$0.00"], [28, 37, 15, 20], 0),
            subtotalRow(["SUBTOTAL SEGURIDAD", "", "$18.00", "$216.00"], [28, 37, 15, 20]),
          ],
        }),
        emptyLine(),

        // ── Tabla AWS: Monitoreo ──
        subtitle("Monitoreo y DNS"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["SERVICIO AWS", "ESPECIFICACIÓN", "MENSUAL", "ANUAL"], [28, 37, 15, 20]),
            dataRow(["Amazon CloudWatch", "Monitoreo de métricas, logs centralizados y alarmas. Incluye dashboards personalizados y retención de logs por 30 días.", "$20.00", "$240.00"], [28, 37, 15, 20], 0),
            dataRow(["Amazon Route 53", "Servicio DNS gestionado. 1 zona hospedada + resolución de consultas DNS para el dominio del sistema.", "$2.00", "$24.00"], [28, 37, 15, 20], 1),
            subtotalRow(["SUBTOTAL MONITOREO Y DNS", "", "$22.00", "$264.00"], [28, 37, 15, 20]),
          ],
        }),
        emptyLine(),

        // ── TOTAL AWS ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            totalRow(["TOTAL INFRAESTRUCTURA AWS", "", "$306.00", "$3,672.00"], [28, 37, 15, 20]),
          ],
        }),

        // ── 3. SERVICIOS EXTERNOS ──
        ...sectionTitle("3. Servicios Externos de Terceros"),
        justified(
          "Además de la infraestructura de AWS, el sistema utiliza servicios especializados de terceros para funcionalidades específicas como geolocalización, envío de correos electrónicos y registro de dominio."
        ),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["SERVICIO", "DESCRIPCIÓN", "MENSUAL", "ANUAL"], [25, 40, 15, 20]),
            dataRow([
              "Google Maps Platform",
              "APIs de Maps JavaScript, Geocoding y Places Autocomplete para visualización de mapa interactivo, localización de direcciones y autocompletado. Google otorga $200 USD/mes de crédito gratuito. Estimado: ~2,000-7,000 llamadas API/mes.",
              "$0 - $50.00",
              "$0 - $600.00",
            ], [25, 40, 15, 20], 0),
            dataRow([
              "Resend (Email)",
              "Servicio de envío de correos electrónicos transaccionales. Plan Pro para notificaciones del marketplace, consultas de compradores y alertas del sistema. Hasta 10,000 emails/mes.",
              "$20.00",
              "$240.00",
            ], [25, 40, 15, 20], 1),
            dataRow([
              "Dominio Web",
              "Registro y renovación anual del dominio del sistema (.gob.pa, .com.pa o .com). Incluye configuración DNS.",
              "—",
              "$50.00",
            ], [25, 40, 15, 20], 0),
            subtotalRow(["SUBTOTAL SERVICIOS EXTERNOS", "", "$20 - $70", "$290 - $890"], [25, 40, 15, 20]),
          ],
        }),
        emptyLine(),
        p("Nota: Google Maps Platform ofrece $200 USD de crédito gratuito mensual. Con el volumen de uso estimado del sistema, es probable que los costos de Google Maps sean de $0 USD en la mayoría de los meses.", {
          italic: true, size: 18, color: C.medium,
        }),

        // ── 4. OBSERVABILIDAD ──
        ...sectionTitle("4. Observabilidad y Monitoreo Avanzado"),
        justified(
          "La observabilidad es fundamental para garantizar la disponibilidad y el rendimiento del sistema en producción. Se presenta a continuación el desglose de herramientas de monitoreo, con opciones desde básicas (incluidas en AWS) hasta premium."
        ),
        emptyLine(),

        subtitle("Opción A — Básica (Incluida en AWS)"),
        p("Amazon CloudWatch ya está incluido en la sección de infraestructura AWS ($20/mes). Proporciona métricas, logs y alarmas básicas. Sin costo adicional.", { before: 60, after: 60 }),
        emptyLine(),

        subtitle("Opción B — Recomendada"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["HERRAMIENTA", "DESCRIPCIÓN", "MENSUAL", "ANUAL"], [25, 40, 15, 20]),
            dataRow([
              "Sentry",
              "Plataforma de monitoreo de errores en tiempo real. Captura automáticamente errores, excepciones y problemas de rendimiento con contexto completo (usuario, navegador, stack trace).",
              "$26.00",
              "$312.00",
            ], [25, 40, 15, 20], 0),
            dataRow([
              "Grafana Cloud (Free)",
              "Dashboards de visualización de métricas con plan gratuito. Permite crear paneles personalizados conectados a CloudWatch y Prometheus.",
              "$0.00",
              "$0.00",
            ], [25, 40, 15, 20], 1),
            subtotalRow(["SUBTOTAL OBSERVABILIDAD (RECOMENDADA)", "", "$26.00", "$312.00"], [25, 40, 15, 20]),
          ],
        }),
        emptyLine(),

        subtitle("Opción C — Premium (Opcional)"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["HERRAMIENTA", "DESCRIPCIÓN", "MENSUAL", "ANUAL"], [25, 40, 15, 20]),
            dataRow([
              "Datadog o New Relic",
              "Plataforma de observabilidad integral con APM (Application Performance Monitoring), logs, métricas, trazabilidad distribuida y alertas avanzadas con IA.",
              "$100 - $300",
              "$1,200 - $3,600",
            ], [25, 40, 15, 20], 0),
            dataRow([
              "Sentry",
              "Monitoreo de errores (igual que opción B).",
              "$26.00",
              "$312.00",
            ], [25, 40, 15, 20], 1),
            subtotalRow(["SUBTOTAL OBSERVABILIDAD (PREMIUM)", "", "$126 - $326", "$1,512 - $3,912"], [25, 40, 15, 20]),
          ],
        }),

        // ── 5. RECURSOS HUMANOS ──
        ...sectionTitle("5. Recursos Humanos — Soporte y Mantenimiento"),
        justified(
          "Para garantizar el correcto funcionamiento, la evolución continua y el soporte técnico del sistema, se requiere un equipo dedicado de dos profesionales especializados que trabajarán de forma permanente en el mantenimiento y mejora de la plataforma."
        ),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["ROL", "RESPONSABILIDADES", "DEDICACIÓN", "MENSUAL", "ANUAL"], [18, 37, 13, 14, 18]),
            dataRow([
              "Ingeniero DevOps / Backend",
              "Administración de infraestructura AWS, monitoreo de servidores, despliegues, respaldos, seguridad, optimización de base de datos, resolución de incidencias de infraestructura.",
              "Tiempo completo",
              "$1,000.00",
              "$12,000.00",
            ], [18, 37, 13, 14, 18], 0),
            dataRow([
              "Desarrollador Full-Stack",
              "Mantenimiento del código, corrección de bugs, implementación de nuevas funcionalidades, actualizaciones de seguridad, soporte a usuarios, mejoras de interfaz.",
              "Tiempo completo",
              "$1,500.00",
              "$18,000.00",
            ], [18, 37, 13, 14, 18], 1),
            subtotalRow(["SUBTOTAL RRHH (SALARIO BASE)", "", "", "$2,500.00", "$30,000.00"], [18, 37, 13, 14, 18]),
          ],
        }),
        emptyLine(),

        subtitle("Prestaciones Legales Estimadas"),
        justified(
          "De acuerdo con la legislación laboral de Panamá, los costos de prestaciones legales pueden representar entre un 30% y 40% adicional sobre el salario base. Esto incluye:"
        ),
        bullet("Décimo tercer mes (XIII mes)"),
        bullet("Vacaciones proporcionales"),
        bullet("Cuota patronal del Seguro Social (CSS)"),
        bullet("Seguro educativo"),
        bullet("Riesgo profesional"),
        bullet("Prima de antigüedad"),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["CONCEPTO", "PORCENTAJE", "MENSUAL", "ANUAL"], [40, 20, 20, 20]),
            dataRow(["Salario base (2 personas)", "100%", "$2,500.00", "$30,000.00"], [40, 20, 20, 20], 0),
            dataRow(["Prestaciones estimadas (30%)", "30%", "$750.00", "$9,000.00"], [40, 20, 20, 20], 1),
            dataRow(["Prestaciones estimadas (40%)", "40%", "$1,000.00", "$12,000.00"], [40, 20, 20, 20], 0),
            subtotalRow(["TOTAL RRHH (CON PRESTACIONES 30%)", "", "$3,250.00", "$39,000.00"], [40, 20, 20, 20]),
            subtotalRow(["TOTAL RRHH (CON PRESTACIONES 40%)", "", "$3,500.00", "$42,000.00"], [40, 20, 20, 20]),
          ],
        }),

        // ── 6. RESUMEN CONSOLIDADO ──
        ...sectionTitle("6. Resumen Consolidado de Inversión Anual", C.primary),
        justified(
          "A continuación se presenta el resumen consolidado de todos los costos operativos anuales del sistema, agrupados por categoría. Se utilizan los valores de la opción recomendada de observabilidad y prestaciones al 30%."
        ),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["#", "CATEGORÍA", "DETALLE", "MENSUAL", "ANUAL"], [5, 25, 35, 15, 20], C.primary),

            // AWS
            dataRow(["1", "Amazon ECS (Fargate)", "Contenedores de la aplicación (2 tareas)", "$36.00", "$432.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["2", "Application Load Balancer", "Balanceo de carga", "$25.00", "$300.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["3", "NAT Gateway", "Acceso seguro a internet", "$45.00", "$540.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["4", "Amazon RDS PostgreSQL", "Base de datos Multi-AZ, 50GB", "$140.00", "$1,680.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["5", "Amazon S3", "Almacenamiento 100GB", "$5.00", "$60.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["6", "Amazon CloudFront", "CDN global", "$15.00", "$180.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["7", "AWS WAF", "Firewall de aplicaciones web", "$15.00", "$180.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["8", "AWS Secrets Manager", "Gestión de credenciales", "$3.00", "$36.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["9", "Amazon CloudWatch", "Monitoreo y logs", "$20.00", "$240.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["10", "Amazon Route 53", "DNS gestionado", "$2.00", "$24.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["11", "AWS Certificate Manager", "SSL/TLS", "$0.00", "$0.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["12", "Amazon VPC", "Red privada virtual", "$0.00", "$0.00"], [5, 25, 35, 15, 20], 1),
            subtotalRow(["", "SUBTOTAL AWS", "", "$306.00", "$3,672.00"], [5, 25, 35, 15, 20]),

            // Servicios Externos
            dataRow(["13", "Google Maps Platform", "APIs de mapas y geolocalización", "$0 - $50", "$0 - $600"], [5, 25, 35, 15, 20], 0),
            dataRow(["14", "Resend (Email)", "Emails transaccionales", "$20.00", "$240.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["15", "Dominio Web", "Registro anual", "—", "$50.00"], [5, 25, 35, 15, 20], 0),
            subtotalRow(["", "SUBTOTAL SERVICIOS EXTERNOS", "", "$20 - $70", "$290 - $890"], [5, 25, 35, 15, 20]),

            // Observabilidad
            dataRow(["16", "Sentry", "Monitoreo de errores", "$26.00", "$312.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["17", "Grafana Cloud", "Dashboards (plan gratuito)", "$0.00", "$0.00"], [5, 25, 35, 15, 20], 1),
            subtotalRow(["", "SUBTOTAL OBSERVABILIDAD", "", "$26.00", "$312.00"], [5, 25, 35, 15, 20]),

            // RRHH
            dataRow(["18", "Ingeniero DevOps/Backend", "Soporte infraestructura", "$1,000.00", "$12,000.00"], [5, 25, 35, 15, 20], 0),
            dataRow(["19", "Desarrollador Full-Stack", "Soporte y desarrollo", "$1,500.00", "$18,000.00"], [5, 25, 35, 15, 20], 1),
            dataRow(["20", "Prestaciones legales (30%)", "XIII mes, CSS, vacaciones", "$750.00", "$9,000.00"], [5, 25, 35, 15, 20], 0),
            subtotalRow(["", "SUBTOTAL RECURSOS HUMANOS", "", "$3,250.00", "$39,000.00"], [5, 25, 35, 15, 20]),

            // GRAN TOTAL
            totalRow(["", "TOTAL INVERSIÓN ANUAL", "(Escenario Recomendado)", "$3,602 - $3,652", "$43,274 - $43,874"], [5, 25, 35, 15, 20]),
          ],
        }),

        // ── 7. ESCENARIOS ──
        ...sectionTitle("7. Escenarios Comparativos"),
        justified(
          "Se presentan tres escenarios de inversión para adaptarse a diferentes niveles de presupuesto y requerimientos operativos:"
        ),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["COMPONENTE", "BÁSICO", "RECOMENDADO", "PREMIUM"], [34, 22, 22, 22]),
            dataRow(["Infraestructura AWS", "$3,672", "$3,672", "$3,672"], [34, 22, 22, 22], 0),
            dataRow(["Servicios Externos", "$290", "$530", "$890"], [34, 22, 22, 22], 1),
            dataRow(["Observabilidad", "$0 (solo CloudWatch)", "$312 (Sentry + Grafana)", "$3,912 (Datadog + Sentry)"], [34, 22, 22, 22], 0),
            dataRow(["RRHH (salario base)", "$30,000", "$30,000", "$30,000"], [34, 22, 22, 22], 1),
            dataRow(["Prestaciones (30-40%)", "$9,000", "$9,000", "$12,000"], [34, 22, 22, 22], 0),
            new TableRow({
              children: [
                cell("TOTAL ANUAL", { bold: true, color: C.white, shading: C.totalBg, width: 34 }),
                cell("$42,962", { bold: true, color: C.white, shading: C.secondary, width: 22, alignment: AlignmentType.RIGHT }),
                cell("$43,514", { bold: true, color: C.white, shading: C.primary, width: 22, alignment: AlignmentType.RIGHT }),
                cell("$50,474", { bold: true, color: C.white, shading: C.accentDark, width: 22, alignment: AlignmentType.RIGHT }),
              ],
            }),
            new TableRow({
              children: [
                cell("COSTO MENSUAL EQUIVALENTE", { bold: true, color: C.medium, shading: C.grayBg, width: 34 }),
                cell("$3,580", { bold: true, color: C.secondary, shading: C.blueBg, width: 22, alignment: AlignmentType.RIGHT }),
                cell("$3,626", { bold: true, color: C.primary, shading: C.greenBg, width: 22, alignment: AlignmentType.RIGHT }),
                cell("$4,206", { bold: true, color: C.accentDark, shading: C.orangeBg, width: 22, alignment: AlignmentType.RIGHT }),
              ],
            }),
          ],
        }),
        emptyLine(),

        bullet("Monitoreo básico con CloudWatch (ya incluido en AWS), sin herramientas externas adicionales. Prestaciones al 30%.", "Escenario Básico"),
        bullet("Agrega Sentry para monitoreo de errores y Grafana Cloud gratuito para dashboards. Google Maps con uso moderado. Prestaciones al 30%.", "Escenario Recomendado"),
        bullet("Monitoreo avanzado con Datadog o New Relic para APM completo, trazabilidad distribuida y alertas con IA. Google Maps con uso elevado. Prestaciones al 40%.", "Escenario Premium"),

        // ── 8. NOTAS Y CONSIDERACIONES ──
        ...sectionTitle("8. Notas y Consideraciones Importantes"),

        subtitle("Sobre los Costos de AWS"),
        bullet("Los costos de AWS son estimaciones basadas en precios públicos de la región us-east-1 (Virginia del Norte) a marzo de 2026. Los precios pueden variar según la región seleccionada."),
        bullet("AWS ofrece descuentos de hasta 40% en Amazon RDS mediante la compra de Reserved Instances con compromiso de 1 o 3 años, lo que podría reducir significativamente el costo de base de datos."),
        bullet("AWS tiene programas especiales para el sector público y gobiernos (AWS GovCloud) con créditos y descuentos adicionales que podrían aplicar a este proyecto."),
        bullet("Los costos de transferencia de datos pueden variar según el volumen de uso real. Las estimaciones incluyen un margen para crecimiento orgánico."),

        subtitle("Sobre Google Maps Platform"),
        bullet("Google otorga un crédito mensual de $200 USD para uso de sus APIs. Con el volumen estimado del sistema (2,000-7,000 llamadas/mes), es probable que no se generen cargos adicionales la mayoría de los meses."),
        bullet("Se recomienda implementar caché de geocodificación para minimizar llamadas repetidas a la API y optimizar costos."),
        bullet("Los precios de Google Maps pueden cambiar según las políticas de Google. Se recomienda monitorear el uso mensualmente."),

        subtitle("Sobre Recursos Humanos"),
        bullet("Los salarios presentados son base mensual. Las prestaciones legales de Panamá (XIII mes, seguro social, vacaciones, etc.) se estiman entre 30% y 40% adicional."),
        bullet("Los costos no incluyen bonificaciones extraordinarias, capacitaciones, equipos de trabajo (laptops, licencias de software), ni beneficios adicionales que la institución decida otorgar."),
        bullet("Se recomienda que al menos uno de los dos recursos tenga experiencia comprobable en administración de servicios AWS."),

        subtitle("Sobre Escalabilidad"),
        bullet("La infraestructura propuesta soporta hasta 100 usuarios concurrentes sin necesidad de cambios. Para escalar más allá, los principales costos que aumentarían son ECS (más tareas), RDS (instancia mayor) y CloudFront (más transferencia)."),
        bullet("El crecimiento de almacenamiento en S3 tiene un costo muy bajo ($0.023/GB/mes), por lo que el aumento de documentos y fotografías no impactará significativamente el presupuesto."),

        // ── 9. CONDICIONES ──
        ...sectionTitle("9. Condiciones y Vigencia"),
        emptyLine(),
        bullet("Esta propuesta tiene una vigencia de 90 días calendario a partir de la fecha de emisión.", "Vigencia"),
        bullet("Los costos de servicios en la nube (AWS, Google Maps, Resend) se facturan mensualmente según el uso real. Los montos presentados son estimaciones basadas en el uso proyectado.", "Facturación"),
        bullet("Los costos pueden ser revisados trimestralmente para ajustar las estimaciones según el uso real observado.", "Ajustes"),
        bullet("USD (Dólares de los Estados Unidos de América), la misma moneda de curso legal en Panamá.", "Moneda"),
        emptyLine(),

        // ── CIERRE ──
        p("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", { color: C.primaryLight, size: 20, before: 400 }),
        emptyLine(),
        p("Esta propuesta ha sido elaborada con base en los requerimientos técnicos", {
          size: 24, color: C.dark, italic: true, alignment: AlignmentType.CENTER,
        }),
        p("de SIAE — Sistema Integral de Activos del Estado (módulo: residuos y chatarra)", {
          size: 24, color: C.dark, italic: true, alignment: AlignmentType.CENTER,
        }),
        p("y los precios públicos vigentes de los proveedores de servicios.", {
          size: 24, color: C.dark, italic: true, alignment: AlignmentType.CENTER,
        }),
        emptyLine(),
        p("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", { color: C.primaryLight, size: 20 }),
        emptyLine(),
        p("Para consultas o aclaraciones, contacte al equipo de proyecto.", {
          size: 22, color: C.medium, alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// ── Generate File ──
async function generate() {
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "./Propuesta_Costo_Operativo_Anual.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Propuesta de costos generada exitosamente: ${outputPath}`);
}

generate().catch((err) => {
  console.error("Error generando propuesta:", err);
  process.exit(1);
});
