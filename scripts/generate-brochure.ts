import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Tab,
  TabStopType,
  TabStopPosition,
  Header,
  Footer,
  ImageRun,
  convertInchesToTwip,
  LevelFormat,
  UnderlineType,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const LOGO_PATH = path.resolve(process.cwd(), "public/images/logo_SIAE.png");
const LOGO_BUFFER = fs.readFileSync(LOGO_PATH);

// ── Color Palette ──
const COLORS = {
  primary: "1B5E20",       // Dark green
  primaryLight: "4CAF50",  // Green
  secondary: "0D47A1",     // Dark blue
  secondaryLight: "1976D2", // Blue
  accent: "FF6F00",        // Amber
  dark: "212121",          // Near black
  medium: "616161",        // Gray
  light: "9E9E9E",         // Light gray
  white: "FFFFFF",
  tableHeader: "E8F5E9",   // Light green bg
  tableAlt: "F5F5F5",      // Light gray bg
  tableHeaderBlue: "E3F2FD", // Light blue bg
};

// ── Helper Functions ──
function createTitle(text: string, color = COLORS.primary): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        color: COLORS.primaryLight,
        size: 20,
        font: "Calibri",
      }),
    ],
  });
}

function createSectionTitle(text: string, color = COLORS.primary): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 500, after: 80 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 32,
          color: color,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: COLORS.primaryLight,
          size: 18,
          font: "Calibri",
        }),
      ],
    }),
  ];
}

function createSubtitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text: `▸ ${text}`,
        bold: true,
        size: 26,
        color: COLORS.secondary,
        font: "Calibri",
      }),
    ],
  });
}

function createBody(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        size: 22,
        color: COLORS.dark,
        font: "Calibri",
      }),
    ],
  });
}

function createBullet(text: string, bold_prefix?: string): Paragraph {
  const children: TextRun[] = [];
  if (bold_prefix) {
    children.push(
      new TextRun({
        text: `● ${bold_prefix}: `,
        bold: true,
        size: 22,
        color: COLORS.primary,
        font: "Calibri",
      }),
      new TextRun({
        text,
        size: 22,
        color: COLORS.dark,
        font: "Calibri",
      })
    );
  } else {
    children.push(
      new TextRun({
        text: `● ${text}`,
        size: 22,
        color: COLORS.dark,
        font: "Calibri",
      })
    );
  }
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: convertInchesToTwip(0.4) },
    children,
  });
}

function createCheckBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: convertInchesToTwip(0.4) },
    children: [
      new TextRun({
        text: `✓ ${text}`,
        size: 22,
        color: COLORS.primary,
        font: "Calibri",
      }),
    ],
  });
}

function createTableCell(
  text: string,
  opts: {
    bold?: boolean;
    color?: string;
    shading?: string;
    width?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {}
): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading
      ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading }
      : undefined,
    margins: {
      top: convertInchesToTwip(0.05),
      bottom: convertInchesToTwip(0.05),
      left: convertInchesToTwip(0.1),
      right: convertInchesToTwip(0.1),
    },
    children: [
      new Paragraph({
        alignment: opts.alignment || AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            size: 20,
            color: opts.color || COLORS.dark,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [] });
}

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: COLORS.dark },
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
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      children: [
        emptyLine(),
        emptyLine(),
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
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: COLORS.primaryLight,
              size: 24,
              font: "Calibri",
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "REPÚBLICA DE PANAMÁ",
              bold: true,
              size: 28,
              color: COLORS.medium,
              font: "Calibri",
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "SIAE",
              bold: true,
              size: 96,
              color: COLORS.primary,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "SISTEMA INTEGRAL DE",
              bold: true,
              size: 44,
              color: COLORS.primary,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "ACTIVOS DEL ESTADO",
              bold: true,
              size: 44,
              color: COLORS.primary,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "Módulo: Administración de Residuos y Chatarra",
              italics: true,
              size: 24,
              color: COLORS.secondary,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: COLORS.primaryLight,
              size: 24,
              font: "Calibri",
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Plataforma Digital para la Gestión Inteligente",
              size: 30,
              color: COLORS.secondary,
              font: "Calibri",
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "de Residuos y Materiales Reciclables",
              size: 30,
              color: COLORS.secondary,
              font: "Calibri",
              italics: true,
            }),
          ],
        }),
        emptyLine(),
        emptyLine(),
        emptyLine(),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "Documento de Presentación General",
              size: 22,
              color: COLORS.medium,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "Versión 1.0 — Marzo 2026",
              size: 22,
              color: COLORS.medium,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "CONFIDENCIAL",
              bold: true,
              size: 20,
              color: COLORS.accent,
              font: "Calibri",
            }),
          ],
        }),
      ],
    },

    // ════════════════════════════════════════════════════
    // CONTENIDO PRINCIPAL
    // ════════════════════════════════════════════════════
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.8),
            bottom: convertInchesToTwip(0.8),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "SIAE — Sistema Integral de Activos del Estado",
                  italics: true,
                  size: 16,
                  color: COLORS.light,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Confidencial — República de Panamá",
                  size: 16,
                  color: COLORS.light,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ── 1. INTRODUCCIÓN ──
        ...createSectionTitle("1. Introducción"),
        createBody(
          "SIAE — Sistema Integral de Activos del Estado es una plataforma digital diseñada para transformar la manera en que la República de Panamá gestiona, monitorea y aprovecha los activos del Estado. En su módulo actual, SIAE se enfoca en la administración de residuos y chatarra almacenados en instituciones públicas a lo largo de todo el territorio nacional."
        ),
        createBody(
          "En la actualidad, la gestión de residuos y chatarra en las instituciones gubernamentales se realiza de forma fragmentada, sin un sistema centralizado que permita conocer con precisión qué materiales existen, dónde se encuentran, en qué cantidades y cuál es su valor estimado. Esta falta de visibilidad genera ineficiencias, desperdicio de recursos y dificultades para cumplir con las regulaciones ambientales vigentes."
        ),
        createBody(
          "Nuestra plataforma resuelve estos desafíos proporcionando un sistema integral, seguro y fácil de usar que centraliza toda la información relacionada con residuos y materiales reciclables, permitiendo a los tomadores de decisiones actuar con datos precisos y en tiempo real."
        ),

        // ── 2. VISIÓN Y PROPUESTA DE VALOR ──
        ...createSectionTitle("2. Visión y Propuesta de Valor"),
        createBody(
          "Nuestra visión es convertir a Panamá en un referente regional en la gestión inteligente de residuos, utilizando tecnología de vanguardia para maximizar el aprovechamiento de materiales reciclables, reducir el impacto ambiental y generar valor económico a partir de lo que tradicionalmente se considera desecho."
        ),
        emptyLine(),
        createSubtitle("Propuesta de Valor"),
        createBullet(
          "Un solo punto de acceso para visualizar todos los materiales residuales del país.",
          "Centralización"
        ),
        createBullet(
          "Información actualizada y verificable sobre ubicaciones, volúmenes, pesos y valores.",
          "Transparencia"
        ),
        createBullet(
          "Acceso desde cualquier dispositivo con conexión a internet, sin necesidad de instalaciones.",
          "Accesibilidad"
        ),
        createBullet(
          "Métricas y reportes que permiten planificar con base en información real.",
          "Decisiones Informadas"
        ),
        createBullet(
          "Marketplace integrado para la comercialización responsable de materiales reciclables.",
          "Valor Económico"
        ),

        // ── 3. FUNCIONALIDADES PRINCIPALES ──
        ...createSectionTitle("3. Funcionalidades Principales"),

        createSubtitle("Dashboard Inteligente"),
        createBody(
          "El panel principal ofrece una vista ejecutiva con indicadores clave en tiempo real: número total de ubicaciones registradas, volumen total de materiales (en metros cúbicos), peso estimado (en kilogramos) y valor económico total estimado. Los usuarios pueden ver de un vistazo el estado general del inventario nacional de residuos, así como la actividad reciente del sistema."
        ),

        createSubtitle("Mapa Interactivo Nacional"),
        createBody(
          "Integración completa con Google Maps que permite visualizar geográficamente todas las instituciones registradas en el sistema. Cada ubicación aparece como un marcador interactivo en el mapa, mostrando al hacer clic información relevante como nombre de la institución, tipos de residuos almacenados y datos de contacto. El mapa incluye filtros por zona, ciudad, municipio y tipo de material, facilitando la búsqueda y análisis geográfico."
        ),

        createSubtitle("Gestión Completa de Ubicaciones"),
        createBody(
          "Sistema integral para registrar y administrar las instituciones públicas que almacenan residuos. Cada registro incluye datos de la institución, dirección exacta con coordenadas geográficas, persona de contacto responsable, y un inventario detallado de los tipos y cantidades de materiales presentes. El sistema soporta la creación, edición, visualización y eliminación de registros con controles de acceso apropiados."
        ),

        createSubtitle("Inventario de Materiales"),
        createBody(
          "Clasificación detallada de más de 12 tipos de residuos, incluyendo chatarra metálica (ferrosa y no ferrosa), residuos electrónicos, baterías, aceites usados, plásticos, madera, papel, vidrio, neumáticos y materiales de construcción, entre otros. Cada material puede ser categorizado por calidad (Excelente, Buena, Regular, Baja, Deficiente), con seguimiento individual de volumen, peso y valor estimado."
        ),

        createSubtitle("Importación y Exportación de Datos"),
        createBody(
          "Capacidad de carga masiva de datos mediante archivos Excel o CSV, con validación automática antes de la importación. El sistema también permite exportar información en formato Excel, ya sea como resumen general o como reporte detallado que incluye todos los tipos de residuos por ubicación. Esta funcionalidad facilita la integración con otros sistemas y la generación de informes para autoridades."
        ),

        createSubtitle("Marketplace de Materiales Reciclables"),
        createBody(
          "Módulo de ventas y ofertas que permite publicar listados de materiales disponibles para comercialización. Incluye gestión de precios de mercado por tipo de material, cálculo automático de valores sugeridos basados en calidad, y un sistema de consultas que permite a interesados enviar solicitudes de información. Este módulo fomenta la economía circular y la generación de valor a partir de materiales en desuso."
        ),

        createSubtitle("Gestión Documental"),
        createBody(
          "Cada ubicación e ítem del inventario puede tener documentos y fotografías adjuntos, almacenados de forma segura en la nube. Esto permite llevar un registro visual del estado de los materiales, adjuntar permisos, actas de inspección u otros documentos relevantes para la trazabilidad y el cumplimiento normativo."
        ),

        createSubtitle("Sistema de Ayuda Integrado"),
        createBody(
          "Tutorial paso a paso y sección de Preguntas Frecuentes (FAQ) accesibles directamente desde la plataforma, asegurando que los usuarios puedan resolver dudas sin necesidad de soporte externo."
        ),

        // ── 4. SEGURIDAD Y CONTROL DE ACCESO ──
        ...createSectionTitle("4. Seguridad y Control de Acceso", COLORS.secondary),
        createBody(
          "La seguridad es un pilar fundamental de la plataforma. El sistema ha sido diseñado siguiendo las mejores prácticas de la industria para proteger la información y garantizar que cada usuario acceda únicamente a las funciones que le corresponden."
        ),

        createSubtitle("Sistema de Roles y Permisos"),
        createBody(
          "La plataforma implementa un modelo de control de acceso basado en roles (RBAC) con tres niveles predefinidos, diseñado para escalar con roles adicionales según las necesidades futuras de la institución:"
        ),
        emptyLine(),

        // Tabla de Roles
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createTableCell("FUNCIONALIDAD", {
                  bold: true,
                  color: COLORS.white,
                  shading: COLORS.secondary,
                  width: 40,
                }),
                createTableCell("ADMINISTRADOR", {
                  bold: true,
                  color: COLORS.white,
                  shading: COLORS.secondary,
                  width: 20,
                  alignment: AlignmentType.CENTER,
                }),
                createTableCell("OPERADOR", {
                  bold: true,
                  color: COLORS.white,
                  shading: COLORS.secondary,
                  width: 20,
                  alignment: AlignmentType.CENTER,
                }),
                createTableCell("VISUALIZADOR", {
                  bold: true,
                  color: COLORS.white,
                  shading: COLORS.secondary,
                  width: 20,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            ...[
              ["Ver Dashboard y Mapa", "✓", "✓", "✓"],
              ["Consultar Ubicaciones", "✓", "✓", "✓"],
              ["Exportar Datos", "✓", "✓", "✓"],
              ["Crear y Editar Ubicaciones", "✓", "✓", "—"],
              ["Importar Datos Masivos", "✓", "✓", "—"],
              ["Gestionar Inventario", "✓", "✓", "—"],
              ["Eliminar Registros", "✓", "—", "—"],
              ["Administrar Usuarios", "✓", "—", "—"],
              ["Ver Registros de Auditoría", "✓", "—", "—"],
              ["Configurar Precios de Mercado", "✓", "—", "—"],
            ].map(
              (row, i) =>
                new TableRow({
                  children: [
                    createTableCell(row[0], {
                      shading: i % 2 === 0 ? COLORS.tableAlt : COLORS.white,
                    }),
                    createTableCell(row[1], {
                      alignment: AlignmentType.CENTER,
                      color: row[1] === "✓" ? COLORS.primaryLight : COLORS.light,
                      bold: row[1] === "✓",
                      shading: i % 2 === 0 ? COLORS.tableAlt : COLORS.white,
                    }),
                    createTableCell(row[2], {
                      alignment: AlignmentType.CENTER,
                      color: row[2] === "✓" ? COLORS.primaryLight : COLORS.light,
                      bold: row[2] === "✓",
                      shading: i % 2 === 0 ? COLORS.tableAlt : COLORS.white,
                    }),
                    createTableCell(row[3], {
                      alignment: AlignmentType.CENTER,
                      color: row[3] === "✓" ? COLORS.primaryLight : COLORS.light,
                      bold: row[3] === "✓",
                      shading: i % 2 === 0 ? COLORS.tableAlt : COLORS.white,
                    }),
                  ],
                })
            ),
          ],
        }),
        emptyLine(),
        createBody(
          "El sistema está diseñado para incorporar roles adicionales en el futuro, como Auditor, Supervisor Regional o roles específicos por institución, permitiendo una granularidad de permisos adaptada a las necesidades organizativas."
        ),

        createSubtitle("Seguridad de la Base de Datos"),
        createBullet(
          "Políticas de seguridad a nivel de fila (Row-Level Security) que garantizan que cada usuario solo puede acceder a los datos que le corresponden según su rol.",
          "Seguridad a Nivel de Fila (RLS)"
        ),
        createBullet(
          "Cada sesión de usuario está protegida mediante tokens JWT (JSON Web Tokens) con expiración automática, previniendo accesos no autorizados.",
          "Autenticación con Tokens Seguros"
        ),
        createBullet(
          "Todos los datos ingresados son validados tanto en el navegador como en el servidor antes de ser procesados, previniendo la inyección de datos maliciosos.",
          "Validación de Datos en Múltiples Capas"
        ),
        createBullet(
          "El sistema incorpora protecciones contra las principales amenazas web (OWASP Top 10), incluyendo inyección SQL, Cross-Site Scripting (XSS) y falsificación de solicitudes (CSRF).",
          "Protección contra Vulnerabilidades"
        ),
        createBullet(
          "Todas las comunicaciones entre el navegador y el servidor están cifradas mediante HTTPS/TLS, protegiendo la información en tránsito.",
          "Cifrado en Tránsito"
        ),

        // ── 5. TRAZABILIDAD Y AUDITORÍA ──
        ...createSectionTitle("5. Trazabilidad y Auditoría"),
        createBody(
          "El sistema mantiene un registro inmutable y detallado de todas las acciones realizadas, cumpliendo con los estándares de auditoría requeridos por instituciones gubernamentales:"
        ),
        emptyLine(),
        createCheckBullet("Registro automático de cada creación, modificación y eliminación de datos"),
        createCheckBullet("Almacenamiento del estado anterior y posterior de cada cambio (historial completo)"),
        createCheckBullet("Identificación del usuario responsable de cada acción con marca de tiempo exacta"),
        createCheckBullet("Seguimiento de inicio y cierre de sesiones de usuario"),
        createCheckBullet("Registro de importaciones masivas con detalle de registros procesados"),
        createCheckBullet("Filtros avanzados para consultar el historial por tipo de acción, entidad o usuario"),
        createCheckBullet("Datos de auditoría protegidos contra modificación o eliminación"),
        emptyLine(),
        createBody(
          "Esta funcionalidad garantiza la transparencia operativa y facilita los procesos de contraloría y rendición de cuentas propios de la administración pública."
        ),

        // ── 6. INFRAESTRUCTURA Y DESPLIEGUE ──
        ...createSectionTitle("6. Infraestructura de Producción", COLORS.secondary),
        createBody(
          "Para el despliegue en producción, la plataforma será alojada en Amazon Web Services (AWS), la infraestructura en la nube más utilizada a nivel mundial, garantizando los más altos estándares de disponibilidad, rendimiento y seguridad."
        ),

        createSubtitle("Arquitectura en AWS"),
        createBullet(
          "La aplicación se ejecutará en contenedores gestionados por Amazon ECS o EKS, permitiendo escalamiento automático según la demanda sin intervención manual.",
          "Cómputo Escalable"
        ),
        createBullet(
          "Base de datos PostgreSQL gestionada por Amazon RDS con respaldos automáticos, réplicas de lectura y recuperación ante desastres.",
          "Base de Datos Gestionada"
        ),
        createBullet(
          "Almacenamiento de documentos y fotografías en Amazon S3, con durabilidad del 99.999999999% (11 nueves) y disponibilidad del 99.99%.",
          "Almacenamiento Seguro"
        ),
        createBullet(
          "Red de distribución de contenido global que acelera la carga de la aplicación para usuarios en cualquier ubicación.",
          "CDN con CloudFront"
        ),
        createBullet(
          "Firewall de aplicaciones web (AWS WAF) que protege contra ataques comunes como inyección SQL, XSS y DDoS.",
          "Protección Perimetral"
        ),

        createSubtitle("Alta Disponibilidad"),
        createBody(
          "La infraestructura se desplegará en múltiples zonas de disponibilidad (Multi-AZ) dentro de la región de AWS, asegurando que el sistema permanezca operativo incluso ante la falla de un centro de datos completo. El escalamiento automático (auto-scaling) ajustará los recursos de cómputo en tiempo real según la carga de usuarios, optimizando tanto el rendimiento como los costos."
        ),

        // ── 7. OBSERVABILIDAD ──
        ...createSectionTitle("7. Observabilidad y Monitoreo"),
        createBody(
          "La plataforma contará con un sistema completo de observabilidad que permite detectar y resolver problemas antes de que impacten a los usuarios, asegurando una experiencia confiable y un tiempo de actividad óptimo."
        ),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createTableCell("COMPONENTE", {
                  bold: true,
                  color: COLORS.white,
                  shading: COLORS.primary,
                  width: 30,
                }),
                createTableCell("DESCRIPCIÓN", {
                  bold: true,
                  color: COLORS.white,
                  shading: COLORS.primary,
                  width: 70,
                }),
              ],
            }),
            ...[
              [
                "Monitoreo en Tiempo Real",
                "Paneles de control con métricas de rendimiento del sistema, tiempos de respuesta y uso de recursos, utilizando herramientas como CloudWatch, Prometheus y Grafana.",
              ],
              [
                "Logs Centralizados",
                "Todos los registros de la aplicación y la infraestructura se recopilan y almacenan de forma centralizada, facilitando la búsqueda y análisis de eventos.",
              ],
              [
                "Alertas Proactivas",
                "Notificaciones automáticas cuando se detectan anomalías, errores frecuentes o degradación del rendimiento, permitiendo acción inmediata.",
              ],
              [
                "Métricas de Uso",
                "Estadísticas detalladas sobre la utilización del sistema: número de usuarios activos, operaciones realizadas, tiempos de carga y disponibilidad.",
              ],
              [
                "Trazabilidad Distribuida",
                "Seguimiento completo de cada solicitud a través de todos los componentes del sistema, facilitando la identificación de cuellos de botella y la resolución de incidencias.",
              ],
              [
                "Respaldos Automáticos",
                "Copias de seguridad automatizadas de la base de datos con capacidad de restauración a cualquier punto en el tiempo (Point-in-Time Recovery).",
              ],
            ].map(
              (row, i) =>
                new TableRow({
                  children: [
                    createTableCell(row[0], {
                      bold: true,
                      color: COLORS.primary,
                      shading: i % 2 === 0 ? COLORS.tableHeader : COLORS.white,
                    }),
                    createTableCell(row[1], {
                      shading: i % 2 === 0 ? COLORS.tableHeader : COLORS.white,
                    }),
                  ],
                })
            ),
          ],
        }),

        // ── 8. TECNOLOGÍA ──
        ...createSectionTitle("8. Plataforma Tecnológica"),
        createBody(
          "El sistema está construido sobre una arquitectura moderna y probada, utilizando tecnologías líderes en la industria que garantizan rendimiento, escalabilidad y facilidad de mantenimiento:"
        ),
        emptyLine(),
        createBullet(
          "Motor de base de datos de nivel empresarial, reconocido por su robustez, confiabilidad y capacidad para manejar grandes volúmenes de información con integridad garantizada.",
          "Base de Datos PostgreSQL"
        ),
        createBullet(
          "Diseñada para ejecutarse nativamente en la nube, aprovechando servicios gestionados que reducen la carga operativa y mejoran la disponibilidad.",
          "Arquitectura Cloud-Native"
        ),
        createBullet(
          "Interfaces de programación estandarizadas que facilitan la integración con otros sistemas gubernamentales, aplicaciones de terceros y futuras extensiones.",
          "APIs RESTful"
        ),
        createBullet(
          "Interfaz adaptable que funciona correctamente en computadoras de escritorio, laptops, tablets y teléfonos móviles, permitiendo el acceso desde cualquier dispositivo.",
          "Diseño Responsive"
        ),
        createBullet(
          "Interfaz construida con las más recientes versiones de React y Next.js, ofreciendo una experiencia de usuario fluida, rápida y moderna.",
          "Interfaz de Usuario Moderna"
        ),

        // ── 9. BENEFICIOS CLAVE ──
        ...createSectionTitle("9. Beneficios Clave", COLORS.primary),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            ...[
              [
                "🔍  Transparencia",
                "Visibilidad completa sobre los materiales residuales en todo el territorio nacional, eliminando zonas grises y facilitando la rendición de cuentas.",
              ],
              [
                "💰  Reducción de Costos",
                "Optimización de la gestión de residuos mediante datos precisos, reduciendo desperdicios y maximizando el valor de los materiales reciclables.",
              ],
              [
                "📊  Decisiones Basadas en Datos",
                "Métricas, reportes y visualizaciones que permiten a los tomadores de decisiones actuar con información verificada y actualizada.",
              ],
              [
                "📋  Cumplimiento Regulatorio",
                "Trazabilidad completa y registros de auditoría que facilitan el cumplimiento de normativas ambientales y de contraloría.",
              ],
              [
                "📈  Escalabilidad",
                "Arquitectura diseñada para crecer con las necesidades del país, desde decenas hasta miles de ubicaciones sin degradación del rendimiento.",
              ],
              [
                "🌐  Acceso Universal",
                "Disponible desde cualquier dispositivo con navegador web, sin necesidad de instalar software adicional.",
              ],
              [
                "♻️  Economía Circular",
                "Marketplace integrado que conecta la oferta de materiales reciclables con compradores interesados, generando valor económico y reduciendo el impacto ambiental.",
              ],
              [
                "🔒  Seguridad Integral",
                "Múltiples capas de seguridad que protegen la información sensible del gobierno y garantizan la privacidad de los datos.",
              ],
            ].map(
              (row, i) =>
                new TableRow({
                  children: [
                    createTableCell(row[0], {
                      bold: true,
                      color: COLORS.primary,
                      shading: i % 2 === 0 ? COLORS.tableHeader : COLORS.white,
                      width: 30,
                    }),
                    createTableCell(row[1], {
                      shading: i % 2 === 0 ? COLORS.tableHeader : COLORS.white,
                      width: 70,
                    }),
                  ],
                })
            ),
          ],
        }),

        // ── 10. ROADMAP ──
        ...createSectionTitle("10. Visión Futura y Evolución"),
        createBody(
          "El sistema ha sido diseñado con una arquitectura extensible que permite incorporar nuevas funcionalidades de manera progresiva. Las siguientes mejoras están contempladas en el plan de evolución de la plataforma:"
        ),
        emptyLine(),

        createSubtitle("Fase 2 — Corto Plazo"),
        createBullet(
          "Módulo completo de gestión de inventario en stock, con seguimiento de entradas, salidas y movimientos de materiales.",
          "Gestión de Stock Avanzada"
        ),
        createBullet(
          "Generación automática de reportes periódicos con envío programado a stakeholders clave.",
          "Reportes Automatizados"
        ),
        createBullet(
          "Sistema de alertas por correo electrónico y dentro de la plataforma para eventos importantes.",
          "Notificaciones Inteligentes"
        ),

        createSubtitle("Fase 3 — Mediano Plazo"),
        createBullet(
          "Aplicación nativa para iOS y Android que permita a los operadores en campo registrar y actualizar información directamente desde el terreno.",
          "Aplicación Móvil"
        ),
        createBullet(
          "Paneles de Business Intelligence con gráficos avanzados, tendencias históricas y análisis predictivo.",
          "Analítica Avanzada con BI"
        ),
        createBullet(
          "Conexión con otros sistemas de información del gobierno para intercambio automatizado de datos.",
          "Integración con Sistemas Gubernamentales"
        ),

        createSubtitle("Fase 4 — Largo Plazo"),
        createBullet(
          "Uso de inteligencia artificial para optimizar rutas de recolección, predecir acumulación de materiales y detectar anomalías.",
          "Inteligencia Artificial"
        ),
        createBullet(
          "Apertura de secciones del sistema para que empresas privadas del sector de reciclaje puedan participar en el marketplace.",
          "Portal del Sector Privado"
        ),
        createBullet(
          "Paneles de información abierta sobre la gestión de residuos a nivel nacional, promoviendo la transparencia gubernamental.",
          "Dashboard Público"
        ),

        // ── CIERRE ──
        emptyLine(),
        new Paragraph({
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: COLORS.primaryLight,
              size: 20,
              font: "Calibri",
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "SIAE — Sistema Integral de Activos del Estado",
              bold: true,
              size: 26,
              color: COLORS.primary,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "representa un paso decisivo hacia la modernización de la gestión pública en Panamá,",
              size: 24,
              color: COLORS.dark,
              font: "Calibri",
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "combinando tecnología de vanguardia con las necesidades reales del país",
              size: 24,
              color: COLORS.dark,
              font: "Calibri",
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "para crear un futuro más sostenible y eficiente.",
              size: 24,
              color: COLORS.dark,
              font: "Calibri",
              italics: true,
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: COLORS.primaryLight,
              size: 20,
              font: "Calibri",
            }),
          ],
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Para más información, contacte al equipo de proyecto.",
              size: 22,
              color: COLORS.medium,
              font: "Calibri",
            }),
          ],
        }),
      ],
    },
  ],
});

// ── Generate File ──
async function generate() {
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "./Brochure_Sistema_Nacional_Residuos.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Brochure generada exitosamente: ${outputPath}`);
}

generate().catch((err) => {
  console.error("Error generando brochure:", err);
  process.exit(1);
});
