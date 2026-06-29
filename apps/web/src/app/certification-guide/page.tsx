import Link from 'next/link'

import { Badge } from '@repo/ui/components/ui/badge'
import { Button } from '@repo/ui/components/ui/button'
import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  CircleHelp,
  GitPullRequest,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow
} from 'lucide-react'

interface StudyCard {
  id: string
  theme: string
  icon: typeof Brain
  question: {
    en: string
    es: string
  }
  answer: string
  why: {
    en: string
    es: string
  }
  concept: {
    en: string
    es: string
  }
  trap: {
    en: string
    es: string
  }
}

const themes = [
  {
    name: 'Claude Code setup',
    nameEs: 'Configuracion de Claude Code',
    icon: BookOpenCheck,
    focus: 'Shared instructions, rules, and skills',
    focusEs: 'Instrucciones compartidas, reglas y skills'
  },
  {
    name: 'Prompting',
    nameEs: 'Prompting',
    icon: Sparkles,
    focus: 'Examples, schemas, self-critique, and clarity',
    focusEs: 'Ejemplos, esquemas, autocritica y claridad'
  },
  {
    name: 'Tool use',
    nameEs: 'Uso de herramientas',
    icon: Workflow,
    focus: 'Selection, guardrails, batching, and data shape',
    focusEs: 'Seleccion, guardrails, lotes y forma de datos'
  },
  {
    name: 'Multi-agent systems',
    nameEs: 'Sistemas multiagente',
    icon: Network,
    focus: 'Coordinator, subagents, synthesis, and errors',
    focusEs: 'Coordinador, subagentes, sintesis y errores'
  },
  {
    name: 'CI and reviews',
    nameEs: 'CI y revisiones',
    icon: GitPullRequest,
    focus: 'Batch API, structured output, review quality',
    focusEs: 'Batch API, salida estructurada, calidad de reviews'
  }
]

const studyCards: StudyCard[] = [
  {
    id: 'project-instructions',
    theme: 'Claude Code setup',
    icon: BookOpenCheck,
    question: {
      en: 'A new teammate is missing a guideline everyone else gets. Why?',
      es: 'Un nuevo companero no recibe una regla que los demas si reciben. Por que?'
    },
    answer: 'D',
    why: {
      en: 'The rule is probably in each old developer user file, not in the repository.',
      es: 'La regla probablemente esta en el archivo personal de cada dev, no en el repositorio.'
    },
    concept: {
      en: 'Team rules belong in project-level `CLAUDE.md` or `.claude/CLAUDE.md`.',
      es: 'Las reglas de equipo van en `CLAUDE.md` o `.claude/CLAUDE.md` del proyecto.'
    },
    trap: {
      en: 'Claude Code does not learn team preferences from repeated personal use.',
      es: 'Claude Code no aprende reglas de equipo por uso personal repetido.'
    }
  },
  {
    id: 'rules-directory',
    theme: 'Claude Code setup',
    icon: BookOpenCheck,
    question: {
      en: 'A huge CLAUDE.md is hard to maintain. How do you organize it?',
      es: 'Un CLAUDE.md enorme es dificil de mantener. Como se organiza?'
    },
    answer: 'C',
    why: {
      en: 'Split focused rules into `.claude/rules/`, optionally scoped by file paths.',
      es: 'Divide reglas enfocadas en `.claude/rules/`, opcionalmente por rutas.'
    },
    concept: {
      en: 'Use modular project rules for testing, API, TypeScript, deployment, and similar topics.',
      es: 'Usa reglas modulares para testing, API, TypeScript, despliegue y temas similares.'
    },
    trap: {
      en: 'Do not rely on random README files as automatic Claude instructions.',
      es: 'No dependas de READMEs aleatorios como instrucciones automaticas.'
    }
  },
  {
    id: 'personal-skill',
    theme: 'Claude Code setup',
    icon: BookOpenCheck,
    question: {
      en: 'A developer wants a personal version of team skill `/commit`.',
      es: 'Un dev quiere una version personal del skill de equipo `/commit`.'
    },
    answer: 'D',
    why: {
      en: 'Create a differently named user skill, like `/my-commit`, to avoid collisions.',
      es: 'Crea un skill personal con otro nombre, como `/my-commit`, para evitar choques.'
    },
    concept: {
      en: 'Project skills are shared. User skills are personal. Same-name skills create ambiguity.',
      es: 'Los skills del proyecto son compartidos. Los de usuario son personales. Mismo nombre crea ambiguedad.'
    },
    trap: {
      en: 'There is no magic `override: true` frontmatter for personal priority.',
      es: 'No existe un `override: true` magico para prioridad personal.'
    }
  },
  {
    id: 'few-shot-transform',
    theme: 'Prompting',
    icon: Sparkles,
    question: {
      en: 'Claude keeps misreading a data transformation described in prose.',
      es: 'Claude sigue malinterpretando una transformacion descrita en texto.'
    },
    answer: 'D',
    why: {
      en: 'Show 2-3 exact input-output examples. Examples remove ambiguity fastest.',
      es: 'Muestra 2-3 ejemplos exactos de entrada y salida. Los ejemplos eliminan ambiguedad rapido.'
    },
    concept: {
      en: 'Few-shot prompting is strongest when the desired structure or mapping is hard to describe.',
      es: 'Few-shot es muy fuerte cuando la estructura o mapeo deseado es dificil de explicar.'
    },
    trap: {
      en: 'More prose often creates more interpretation space.',
      es: 'Mas prosa muchas veces crea mas espacio de interpretacion.'
    }
  },
  {
    id: 'self-critique',
    theme: 'Prompting',
    icon: Brain,
    question: {
      en: 'Complex support answers are correct but omit policy, timeline, or next steps.',
      es: 'Respuestas complejas son correctas pero omiten politica, tiempos o siguientes pasos.'
    },
    answer: 'B',
    why: {
      en: 'Add a self-critique pass against a completeness rubric before sending.',
      es: 'Agrega una autocritica contra una rubrica de completitud antes de enviar.'
    },
    concept: {
      en: 'Evaluator-optimizer: draft, evaluate, improve, then respond.',
      es: 'Evaluador-optimizador: borrador, evaluar, mejorar y responder.'
    },
    trap: {
      en: 'Asking the customer if it was enough shifts work to the customer.',
      es: 'Preguntar al cliente si fue suficiente le pasa el trabajo al cliente.'
    }
  },
  {
    id: 'actionable-feedback',
    theme: 'Prompting',
    icon: Sparkles,
    question: {
      en: 'Automated review findings are valid but vague.',
      es: 'Los hallazgos del review automatico son validos pero vagos.'
    },
    answer: 'D',
    why: {
      en: 'Few-shot examples show the exact actionable format: location, issue, severity, fix.',
      es: 'Ejemplos few-shot muestran el formato accionable exacto: ubicacion, problema, severidad, arreglo.'
    },
    concept: {
      en: 'Examples define what “specific” means better than abstract instructions.',
      es: 'Los ejemplos definen mejor que significa "especifico" que instrucciones abstractas.'
    },
    trap: {
      en: 'Adding more rules can still produce inconsistent output.',
      es: 'Agregar mas reglas aun puede producir salida inconsistente.'
    }
  },
  {
    id: 'severity-rubric',
    theme: 'Prompting',
    icon: ShieldCheck,
    question: {
      en: 'Similar review issues get inconsistent severity labels.',
      es: 'Problemas similares reciben severidades inconsistentes.'
    },
    answer: 'A',
    why: {
      en: 'Use explicit severity criteria with concrete code examples for each level.',
      es: 'Usa criterios explicitos de severidad con ejemplos de codigo para cada nivel.'
    },
    concept: {
      en: 'Anchor subjective labels with objective rubrics.',
      es: 'Ancla etiquetas subjetivas con rubricas objetivas.'
    },
    trap: {
      en: 'Severity should not be relative to the current PR only.',
      es: 'La severidad no debe ser relativa solo al PR actual.'
    }
  },
  {
    id: 'comment-review',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'Comment analysis flags harmless TODOs but misses stale behavior claims.',
      es: 'El analisis de comentarios marca TODOs validos pero no detecta comentarios obsoletos.'
    },
    answer: 'B',
    why: {
      en: 'Tell Claude to flag only comments that contradict actual code behavior.',
      es: 'Indica a Claude marcar solo comentarios que contradicen el comportamiento real del codigo.'
    },
    concept: {
      en: 'Narrow the evaluation criterion to functional contradiction.',
      es: 'Reduce el criterio de evaluacion a contradiccion funcional.'
    },
    trap: {
      en: '“Accurate and up-to-date” is too broad and invites nitpicks.',
      es: '"Exacto y actualizado" es demasiado amplio e invita ruido.'
    }
  },
  {
    id: 'tool-descriptions',
    theme: 'Tool use',
    icon: Workflow,
    question: {
      en: 'The agent calls `get_customer` for order questions.',
      es: 'El agente llama `get_customer` para preguntas de pedidos.'
    },
    answer: 'A or D',
    why: {
      en: 'First inspect and improve tool descriptions: purpose, examples, boundaries, and negative cases.',
      es: 'Primero revisa y mejora descripciones: proposito, ejemplos, limites y casos negativos.'
    },
    concept: {
      en: 'Tool descriptions are the model routing surface.',
      es: 'Las descripciones de herramientas son la superficie de enrutamiento del modelo.'
    },
    trap: {
      en: 'Do not start with a separate keyword router if the tool schema is weak.',
      es: 'No empieces con un router por keywords si el schema de herramientas es debil.'
    }
  },
  {
    id: 'ambiguous-few-shot',
    theme: 'Tool use',
    icon: Workflow,
    question: {
      en: 'You add few-shot examples for ambiguous tool selection.',
      es: 'Agregas ejemplos few-shot para seleccion ambigua de herramientas.'
    },
    answer: 'C',
    why: {
      en: 'Use 4-6 ambiguous examples with reasoning for why one tool wins.',
      es: 'Usa 4-6 ejemplos ambiguos con razonamiento de por que gana una herramienta.'
    },
    concept: {
      en: 'Teach the decision boundary, not only easy cases.',
      es: 'Ensena el limite de decision, no solo casos faciles.'
    },
    trap: {
      en: 'Many obvious examples do not help with messy real requests.',
      es: 'Muchos ejemplos obvios no ayudan con solicitudes reales confusas.'
    }
  },
  {
    id: 'semantic-bias',
    theme: 'Tool use',
    icon: Brain,
    question: {
      en: 'The word “account” makes Claude choose customer lookup.',
      es: 'La palabra "account" hace que Claude elija busqueda de cliente.'
    },
    answer: 'C',
    why: {
      en: 'Base-model semantic associations can bias tool routing.',
      es: 'Asociaciones semanticas del modelo base pueden sesgar el ruteo.'
    },
    concept: {
      en: 'Fix with clearer boundaries and negative examples.',
      es: 'Corrige con limites claros y ejemplos negativos.'
    },
    trap: {
      en: 'The root cause may not be a broken system prompt.',
      es: 'La causa raiz puede no ser un system prompt roto.'
    }
  },
  {
    id: 'disambiguation',
    theme: 'Tool use',
    icon: ShieldCheck,
    question: {
      en: '`get_customer` returns multiple matching customers.',
      es: '`get_customer` devuelve multiples clientes posibles.'
    },
    answer: 'D',
    why: {
      en: 'Ask for a unique identifier before any customer-specific action.',
      es: 'Pide un identificador unico antes de cualquier accion especifica.'
    },
    concept: {
      en: 'For identity, never guess. Disambiguate.',
      es: 'Para identidad, nunca adivines. Desambigua.'
    },
    trap: {
      en: 'Confidence scores still permit wrong-account actions.',
      es: 'Los scores de confianza aun permiten acciones en cuentas equivocadas.'
    }
  },
  {
    id: 'programmatic-guardrail',
    theme: 'Tool use',
    icon: ShieldCheck,
    question: {
      en: 'The agent sometimes skips verification before refunds.',
      es: 'El agente a veces salta verificacion antes de reembolsos.'
    },
    answer: 'C',
    why: {
      en: 'Block sensitive tools until a verified customer ID exists.',
      es: 'Bloquea herramientas sensibles hasta tener un customer ID verificado.'
    },
    concept: {
      en: 'Critical safety rules need deterministic code guardrails.',
      es: 'Reglas criticas de seguridad necesitan guardrails deterministicos en codigo.'
    },
    trap: {
      en: 'Prompt wording alone cannot guarantee compliance.',
      es: 'Solo cambiar el prompt no garantiza cumplimiento.'
    }
  },
  {
    id: 'agent-loop',
    theme: 'Tool use',
    icon: Workflow,
    question: {
      en: 'How does an app know whether to continue the tool loop?',
      es: 'Como sabe una app si debe continuar el loop de herramientas?'
    },
    answer: 'D',
    why: {
      en: 'Continue on `stop_reason: "tool_use"`. Stop on `stop_reason: "end_turn"`.',
      es: 'Continua con `stop_reason: "tool_use"`. Termina con `stop_reason: "end_turn"`.'
    },
    concept: {
      en: 'Use structured API control flow, not natural-language parsing.',
      es: 'Usa control estructurado del API, no parseo de lenguaje natural.'
    },
    trap: {
      en: 'Assistant text can appear before a tool call, so text is not the stop signal.',
      es: 'Puede haber texto antes de una herramienta, asi que el texto no es la senal final.'
    }
  },
  {
    id: 'parallel-tools',
    theme: 'Tool use',
    icon: Workflow,
    question: {
      en: 'The agent calls customer and order tools in separate turns.',
      es: 'El agente llama herramientas de cliente y pedido en turnos separados.'
    },
    answer: 'C',
    why: {
      en: 'Prompt Claude to batch needed tool calls and return all tool results together.',
      es: 'Indica a Claude agrupar herramientas necesarias y devolver resultados juntos.'
    },
    concept: {
      en: 'Parallel tool use reduces API round-trips.',
      es: 'El uso paralelo de herramientas reduce viajes al API.'
    },
    trap: {
      en: 'Do not execute unrequested speculative tools.',
      es: 'No ejecutes herramientas especulativas no solicitadas.'
    }
  },
  {
    id: 'normalize-tool-data',
    theme: 'Tool use',
    icon: Layers3,
    question: {
      en: 'Tool outputs use timestamps and numeric status codes inconsistently.',
      es: 'Las herramientas devuelven timestamps y codigos numericos inconsistentes.'
    },
    answer: 'B',
    why: {
      en: 'Return human-readable formats from owned tools; wrap third-party tools.',
      es: 'Devuelve formatos legibles en herramientas propias; envuelve las de terceros.'
    },
    concept: {
      en: 'Normalize before data enters the LLM context.',
      es: 'Normaliza antes de que los datos entren al contexto del LLM.'
    },
    trap: {
      en: 'Do not force the model to decode mechanical mappings every time.',
      es: 'No obligues al modelo a decodificar mapeos mecanicos cada vez.'
    }
  },
  {
    id: 'case-facts',
    theme: 'Tool use',
    icon: Layers3,
    question: {
      en: 'Progressive summaries lose exact discounts, dates, and amounts.',
      es: 'Los resumenes progresivos pierden descuentos, fechas y montos exactos.'
    },
    answer: 'D',
    why: {
      en: 'Extract transactional facts into a persistent case-facts block.',
      es: 'Extrae hechos transaccionales a un bloque persistente de datos del caso.'
    },
    concept: {
      en: 'Separate conversational history from durable working memory.',
      es: 'Separa historial conversacional de memoria de trabajo durable.'
    },
    trap: {
      en: 'Better summaries can still drop numbers after many compressions.',
      es: 'Mejores resumenes aun pueden perder numeros tras muchas compresiones.'
    }
  },
  {
    id: 'escalation-policy',
    theme: 'Tool use',
    icon: CircleHelp,
    question: {
      en: 'When should a support agent escalate?',
      es: 'Cuando debe escalar un agente de soporte?'
    },
    answer: 'B',
    why: {
      en: 'Escalate when policy is missing or requires human judgment.',
      es: 'Escala cuando falta politica o se requiere criterio humano.'
    },
    concept: {
      en: 'AI should act within tools, facts, and policy boundaries.',
      es: 'La IA debe actuar dentro de herramientas, hechos y politicas.'
    },
    trap: {
      en: 'Do not escalate just because a case has two simple intents.',
      es: 'No escales solo porque un caso tiene dos intenciones simples.'
    }
  },
  {
    id: 'multi-concern',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'Multi-concern customer requests mix parameters and miss concerns.',
      es: 'Solicitudes con varias preocupaciones mezclan parametros y omiten partes.'
    },
    answer: 'A',
    why: {
      en: 'Decompose into individual requests, process separately, then combine.',
      es: 'Descompone en solicitudes individuales, procesa aparte y combina.'
    },
    concept: {
      en: 'Query decomposition prevents parameter cross-contamination.',
      es: 'La descomposicion evita contaminacion cruzada de parametros.'
    },
    trap: {
      en: 'A bigger general-purpose tool usually increases confusion.',
      es: 'Una herramienta general mas grande suele aumentar la confusion.'
    }
  },
  {
    id: 'complex-parallel',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'Complex billing cases take 12+ calls and repeat lookups.',
      es: 'Casos complejos de facturacion toman 12+ llamadas y repiten busquedas.'
    },
    answer: 'A',
    why: {
      en: 'Split concerns, share customer context once, investigate in parallel, synthesize.',
      es: 'Divide preocupaciones, comparte contexto de cliente una vez, investiga en paralelo y sintetiza.'
    },
    concept: {
      en: 'Orchestrator-worker improves latency and reliability for complex tasks.',
      es: 'Orquestador-worker mejora latencia y confiabilidad en tareas complejas.'
    },
    trap: {
      en: 'Verification gates can make everything even more sequential.',
      es: 'Gates de verificacion pueden volver todo aun mas secuencial.'
    }
  },
  {
    id: 'coordinator-hub',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'Why keep a coordinator between subagents?',
      es: 'Por que mantener un coordinador entre subagentes?'
    },
    answer: 'C',
    why: {
      en: 'The coordinator observes, handles errors, controls context, and governs data flow.',
      es: 'El coordinador observa, maneja errores, controla contexto y gobierna el flujo de datos.'
    },
    concept: {
      en: 'Hub-and-spoke keeps agents decoupled and scoped.',
      es: 'Hub-and-spoke mantiene agentes desacoplados y acotados.'
    },
    trap: {
      en: 'Direct agent-to-agent communication creates hidden coupling.',
      es: 'Comunicacion directa entre agentes crea acoplamiento oculto.'
    }
  },
  {
    id: 'task-decomposition',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'A broad research report misses music, writing, and film.',
      es: 'Un reporte amplio omite musica, escritura y cine.'
    },
    answer: 'D',
    why: {
      en: 'The coordinator decomposed the task too narrowly at the start.',
      es: 'El coordinador descompuso la tarea demasiado estrecha al inicio.'
    },
    concept: {
      en: 'Planning quality determines what subagents even look for.',
      es: 'La calidad del plan determina que buscaran los subagentes.'
    },
    trap: {
      en: 'Subagents cannot find domains they were never assigned.',
      es: 'Los subagentes no encuentran dominios que nunca recibieron.'
    }
  },
  {
    id: 'partition-research',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'Two research agents duplicate the same subtopics.',
      es: 'Dos agentes de investigacion duplican los mismos subtemas.'
    },
    answer: 'B',
    why: {
      en: 'The coordinator should partition the research space before delegation.',
      es: 'El coordinador debe particionar el espacio de investigacion antes de delegar.'
    },
    concept: {
      en: 'Prevent overlap before spending tokens.',
      es: 'Evita solapamiento antes de gastar tokens.'
    },
    trap: {
      en: 'Post-hoc deduplication does not recover wasted cost.',
      es: 'Deduplicar despues no recupera costo desperdiciado.'
    }
  },
  {
    id: 'least-privilege',
    theme: 'Multi-agent systems',
    icon: ShieldCheck,
    question: {
      en: 'A document agent uses `fetch_url` to do ad-hoc web searches.',
      es: 'Un agente de documentos usa `fetch_url` para busquedas web improvisadas.'
    },
    answer: 'C',
    why: {
      en: 'Replace broad `fetch_url` with `load_document` that validates document URLs.',
      es: 'Reemplaza `fetch_url` amplio con `load_document` que valida URLs de documentos.'
    },
    concept: {
      en: 'Least privilege: give agents only the capability they need.',
      es: 'Minimo privilegio: da a los agentes solo la capacidad necesaria.'
    },
    trap: {
      en: 'Prompt warnings are weaker than tool-level constraints.',
      es: 'Advertencias en prompt son mas debiles que restricciones en la herramienta.'
    }
  },
  {
    id: 'structured-error',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'A search subagent times out. What should it return?',
      es: 'Un subagente de busqueda hace timeout. Que debe devolver?'
    },
    answer: 'D',
    why: {
      en: 'Return structured error context: failure type, query, partial results, alternatives.',
      es: 'Devuelve error estructurado: tipo, query, resultados parciales, alternativas.'
    },
    concept: {
      en: 'Coordinators recover intelligently only with useful context.',
      es: 'Los coordinadores se recuperan bien solo con contexto util.'
    },
    trap: {
      en: 'Empty successful results hide infrastructure failures.',
      es: 'Resultados vacios exitosos ocultan fallas de infraestructura.'
    }
  },
  {
    id: 'local-recovery',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'A PDF subagent fails on timeouts, passwords, and corrupt files.',
      es: 'Un subagente PDF falla con timeouts, passwords y archivos corruptos.'
    },
    answer: 'C',
    why: {
      en: 'Handle routine recovery locally, then propagate unresolved errors with attempts and partials.',
      es: 'Maneja recuperacion rutinaria localmente, luego propaga errores no resueltos con intentos y parciales.'
    },
    concept: {
      en: 'Subagents should own domain-specific resilience.',
      es: 'Los subagentes deben manejar resiliencia propia de su dominio.'
    },
    trap: {
      en: 'Do not make the coordinator micromanage every routine exception.',
      es: 'No hagas que el coordinador microgestione cada excepcion rutinaria.'
    }
  },
  {
    id: 'conflicting-stats',
    theme: 'Multi-agent systems',
    icon: Network,
    question: {
      en: 'Two credible documents conflict on a key statistic.',
      es: 'Dos documentos creibles contradicen una estadistica clave.'
    },
    answer: 'D',
    why: {
      en: 'Include both, explicitly mark the conflict, cite sources, let coordinator reconcile.',
      es: 'Incluye ambos, marca el conflicto, cita fuentes y deja que el coordinador reconcilie.'
    },
    concept: {
      en: 'Preserve evidence; do not silently pick winners.',
      es: 'Preserva evidencia; no elijas ganadores en silencio.'
    },
    trap: {
      en: 'Unflagged conflicts can be merged or ignored during synthesis.',
      es: 'Conflictos sin marcar pueden fusionarse o ignorarse en sintesis.'
    }
  },
  {
    id: 'lost-middle',
    theme: 'Multi-agent systems',
    icon: Layers3,
    question: {
      en: 'A 75K-token synthesis misses findings in the middle.',
      es: 'Una sintesis de 75K tokens omite hallazgos en el medio.'
    },
    answer: 'C',
    why: {
      en: 'Put key findings first and structure details with clear section headers.',
      es: 'Pon hallazgos clave al inicio y detalles con encabezados claros.'
    },
    concept: {
      en: 'Lost in the middle: models attend best to beginning and end.',
      es: 'Perdido en el medio: los modelos atienden mejor al inicio y al final.'
    },
    trap: {
      en: 'A larger context window does not guarantee equal attention.',
      es: 'Una ventana de contexto mas grande no garantiza atencion igual.'
    }
  },
  {
    id: 'synthesis-coverage',
    theme: 'Multi-agent systems',
    icon: Layers3,
    question: {
      en: 'Some sources timed out but synthesis must proceed.',
      es: 'Algunas fuentes hicieron timeout pero la sintesis debe continuar.'
    },
    answer: 'A',
    why: {
      en: 'Produce the summary with coverage annotations and explicit gaps.',
      es: 'Produce el resumen con anotaciones de cobertura y vacios explicitos.'
    },
    concept: {
      en: 'Graceful degradation plus provenance keeps reports truthful.',
      es: 'Degradacion elegante mas procedencia mantiene reportes honestos.'
    },
    trap: {
      en: 'Do not hide missing sources as if the report were complete.',
      es: 'No ocultes fuentes faltantes como si el reporte estuviera completo.'
    }
  },
  {
    id: 'batch-api-fit',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'Which tasks fit Message Batches API?',
      es: 'Que tareas encajan con Message Batches API?'
    },
    answer: 'C or D',
    why: {
      en: 'Use batches for non-blocking overnight or weekly work; use sync calls for PR gates.',
      es: 'Usa batches para trabajo nocturno o semanal no bloqueante; usa sync para gates de PR.'
    },
    concept: {
      en: 'Batches save cost but can take up to 24 hours.',
      es: 'Batches ahorran costo pero pueden tardar hasta 24 horas.'
    },
    trap: {
      en: 'Do not put merge-blocking checks behind a 24-hour async process.',
      es: 'No pongas checks bloqueantes de merge detras de un proceso async de 24 horas.'
    }
  },
  {
    id: 'batch-tool-loop',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'Can batch processing run an interactive file-fetch tool loop?',
      es: 'Puede batch processing ejecutar un loop interactivo que trae archivos?'
    },
    answer: 'D',
    why: {
      en: 'Batches cannot pause mid-request, execute tools, then continue in the same request.',
      es: 'Batches no pueden pausar a mitad, ejecutar herramientas y continuar en la misma solicitud.'
    },
    concept: {
      en: 'Agentic multi-turn workflows need synchronous orchestration.',
      es: 'Workflows agenticos multi-turn necesitan orquestacion sincrona.'
    },
    trap: {
      en: 'Tool definitions may be allowed, but fulfillment cannot happen interactively inside one batch.',
      es: 'Puede haber definiciones de herramientas, pero no ejecucion interactiva dentro de un batch.'
    }
  },
  {
    id: 'claude-cli-batch',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'Claude Code hangs in CI waiting for interactive input.',
      es: 'Claude Code se queda colgado en CI esperando input interactivo.'
    },
    answer: 'A',
    why: {
      en: 'Run non-interactively with the CLI batch mode expected by the scenario.',
      es: 'Ejecutalo de forma no interactiva con el modo batch esperado por el escenario.'
    },
    concept: {
      en: 'CI needs non-interactive execution and predictable exit behavior.',
      es: 'CI necesita ejecucion no interactiva y salida predecible.'
    },
    trap: {
      en: 'Redirecting stdin is not a reliable substitute for supported CLI mode.',
      es: 'Redirigir stdin no sustituye de forma confiable al modo soportado por CLI.'
    }
  },
  {
    id: 'structured-review-output',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'CI must post each Claude finding as an inline PR comment.',
      es: 'CI debe publicar cada hallazgo como comentario inline del PR.'
    },
    answer: 'C',
    why: {
      en: 'Use JSON output and a JSON schema, then map fields to the PR API.',
      es: 'Usa salida JSON y JSON schema, luego mapea campos al API del PR.'
    },
    concept: {
      en: 'Automation needs structured contracts, not parseable-looking prose.',
      es: 'La automatizacion necesita contratos estructurados, no prosa que parece parseable.'
    },
    trap: {
      en: 'Prompt-only templates can drift and break parsers.',
      es: 'Templates solo por prompt pueden desviarse y romper parsers.'
    }
  },
  {
    id: 'prior-findings',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'Reruns post duplicate comments after developers push fixes.',
      es: 'Reruns publican comentarios duplicados tras fixes del dev.'
    },
    answer: 'D',
    why: {
      en: 'Include prior findings in context and ask for only new or still-unresolved issues.',
      es: 'Incluye hallazgos previos en contexto y pide solo nuevos o no resueltos.'
    },
    concept: {
      en: 'Review automation is stateless unless you provide history.',
      es: 'La automatizacion de review es stateless si no le das historial.'
    },
    trap: {
      en: 'String matching previous comments is brittle.',
      es: 'Comparar strings de comentarios previos es fragil.'
    }
  },
  {
    id: 'large-pr-review',
    theme: 'CI and reviews',
    icon: GitPullRequest,
    question: {
      en: 'A 14-file PR review is superficial and contradictory.',
      es: 'Un review de 14 archivos es superficial y contradictorio.'
    },
    answer: 'B',
    why: {
      en: 'Review each file locally, then run a separate integration pass.',
      es: 'Revisa cada archivo localmente y luego haz una pasada de integracion.'
    },
    concept: {
      en: 'MapReduce-style review prevents attention dilution.',
      es: 'Review estilo MapReduce evita dilucion de atencion.'
    },
    trap: {
      en: 'More context capacity does not fix poor task structure.',
      es: 'Mas capacidad de contexto no arregla una mala estructura de tarea.'
    }
  },
  {
    id: 'independent-reviewer',
    theme: 'CI and reviews',
    icon: Brain,
    question: {
      en: 'Claude generated code and missed subtle side effects in self-review.',
      es: 'Claude genero codigo y no vio efectos sutiles en su self-review.'
    },
    answer: 'D',
    why: {
      en: 'Use a second independent Claude instance that sees the code, not the generator reasoning.',
      es: 'Usa una segunda instancia independiente que vea el codigo, no el razonamiento del generador.'
    },
    concept: {
      en: 'Independent review reduces confirmation bias.',
      es: 'Revision independiente reduce sesgo de confirmacion.'
    },
    trap: {
      en: 'Asking the same context to think longer may just strengthen the same belief.',
      es: 'Pedirle al mismo contexto pensar mas puede reforzar la misma creencia.'
    }
  },
  {
    id: 'trust-and-noise',
    theme: 'CI and reviews',
    icon: ShieldCheck,
    question: {
      en: 'Style findings are noisy and make developers distrust all findings.',
      es: 'Hallazgos de estilo son ruidosos y hacen desconfiar de todos los hallazgos.'
    },
    answer: 'C',
    why: {
      en: 'Temporarily disable high-false-positive categories; keep high-precision ones.',
      es: 'Desactiva temporalmente categorias con muchos falsos positivos; conserva las precisas.'
    },
    concept: {
      en: 'Protect trust by reducing alert fatigue.',
      es: 'Protege la confianza reduciendo fatiga de alertas.'
    },
    trap: {
      en: 'Confidence badges do not fix a noisy product experience.',
      es: 'Badges de confianza no arreglan una experiencia ruidosa.'
    }
  }
]

const answerPatterns = [
  {
    en: 'If the issue is ambiguity, prefer examples or sharper descriptions.',
    es: 'Si el problema es ambiguedad, prefiere ejemplos o descripciones mas precisas.'
  },
  {
    en: 'If the issue is safety or identity, prefer deterministic guardrails.',
    es: 'Si el problema es seguridad o identidad, prefiere guardrails deterministicos.'
  },
  {
    en: 'If the issue is multiple concerns, decompose before execution.',
    es: 'Si hay multiples preocupaciones, descompone antes de ejecutar.'
  },
  {
    en: 'If the issue is agent coordination, keep the coordinator in control.',
    es: 'Si el problema es coordinacion, manten al coordinador en control.'
  },
  {
    en: 'If the issue is CI latency, sync for blocking work and batches for background work.',
    es: 'Si el problema es latencia en CI, sync para bloqueante y batches para background.'
  }
]

const practice = [
  {
    q: 'A refund tool can run before user verification. Best fix?',
    qEs: 'Una herramienta de reembolso corre antes de verificar al usuario. Mejor arreglo?',
    a: 'Programmatic prerequisite / prerequisito programatico.'
  },
  {
    q: 'A vague “analyze content” tool conflicts with document analysis. Best fix?',
    qEs: 'Una herramienta vaga “analyze content” choca con analisis de documentos. Mejor arreglo?',
    a: 'Rename and narrow the tool / renombrar y acotar la herramienta.'
  },
  {
    q: 'Batch job must call tools mid-analysis. Good fit for Message Batches?',
    qEs: 'Un batch debe llamar herramientas durante el analisis. Encaja con Message Batches?',
    a: 'No. Use synchronous orchestration / no. Usa orquestacion sincrona.'
  },
  {
    q: 'A model misses data buried in the middle of a long prompt. Best fix?',
    qEs: 'El modelo omite datos enterrados en medio de un prompt largo. Mejor arreglo?',
    a: 'Key findings first, clear headers / hallazgos clave primero, encabezados claros.'
  }
]

export const metadata = {
  title: 'Claude Certification Guide'
}

type Language = 'en' | 'es'

const languageCopy = {
  en: {
    home: 'Home',
    otherLanguage: 'Ver en espanol',
    otherHref: '/certification-guide/es',
    badge: 'English guide',
    title: 'Claude Certification Study Guide',
    intro:
      'A clean study page with the question, correct answer, short reason, key concept, and common trap.',
    patternTitle: 'How to think during the test',
    cardsLabel: 'cards',
    answerLabel: 'Correct answer',
    questionLabel: 'Question',
    whyLabel: 'Why this is correct',
    conceptLabel: 'Concept to understand',
    trapLabel: 'Common trap',
    practiceTitle: 'Mini practice',
    practiceIntro: 'Extra questions to train the pattern without long explanations.'
  },
  es: {
    home: 'Inicio',
    otherLanguage: 'Read in English',
    otherHref: '/certification-guide/en',
    badge: 'Guia en espanol',
    title: 'Guia de estudio para la certificacion Claude',
    intro:
      'Una pagina limpia con la pregunta, respuesta correcta, razon corta, concepto clave y trampa comun.',
    patternTitle: 'Como pensar durante el test',
    cardsLabel: 'tarjetas',
    answerLabel: 'Respuesta correcta',
    questionLabel: 'Pregunta',
    whyLabel: 'Por que es correcta',
    conceptLabel: 'Concepto que debes entender',
    trapLabel: 'Trampa comun',
    practiceTitle: 'Practica rapida',
    practiceIntro: 'Preguntas extra para entrenar el patron sin explicaciones largas.'
  }
} satisfies Record<Language, Record<string, string>>

export default function CertificationGuidePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="
        mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8
        sm:px-6
        lg:px-10
      ">
        <nav>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Home
            </Link>
          </Button>
        </nav>

        <header className="rounded-lg border border-white/10 bg-white/4 p-6">
          <div className="
            mb-4 flex size-12 items-center justify-center rounded-lg border
            border-orange-200/20 bg-orange-300/10 text-orange-100
          ">
            <BookOpenCheck className="size-6" />
          </div>
          <h1 className="
            max-w-3xl text-4xl/tight font-semibold tracking-normal
            text-foreground
            sm:text-5xl/tight
          ">
            Choose your study language
          </h1>
          <p className="mt-4 max-w-2xl text-base/7 text-muted-foreground">
            I split the guide into two separate pages so the questions and
            answers are easier to read.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/certification-guide/en">English guide</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/certification-guide/es">Guia en espanol</Link>
            </Button>
          </div>
        </header>
      </section>
    </main>
  )
}

export function CertificationGuideContent({ language }: { language: Language }) {
  const copy = languageCopy[language]
  const text = (value: { en: string; es: string }) => value[language]

  return (
    <main className="min-h-screen bg-background">
      <section className="
        mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8
        sm:px-6
        lg:px-10
      ">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              {copy.home}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={copy.otherHref}>{copy.otherLanguage}</Link>
          </Button>
          <Badge variant="outline" className="
            border-orange-200/20 text-orange-100
          ">
            {copy.badge}
          </Badge>
        </nav>

        <header className="
          grid gap-8
          lg:grid-cols-[0.95fr_1.05fr] lg:items-end
        ">
          <div>
            <div className="
              mb-4 flex size-12 items-center justify-center rounded-lg border
              border-orange-200/20 bg-orange-300/10 text-orange-100
            ">
              <BookOpenCheck className="size-6" />
            </div>
            <h1 className="
              max-w-3xl text-4xl/tight font-semibold tracking-normal
              text-foreground
              sm:text-5xl/tight
            ">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base/7 text-muted-foreground">
              {copy.intro}
            </p>
          </div>

          <div className="
            grid gap-3
            sm:grid-cols-2
          ">
            {answerPatterns.map((pattern) => (
              <div
                key={pattern.en}
                className="rounded-lg border border-white/10 bg-white/4 p-4"
              >
                <p className="
                  text-xs font-semibold tracking-wide text-orange-100/80
                  uppercase
                ">
                  {copy.patternTitle}
                </p>
                <p className="mt-2 text-sm/6 text-foreground">
                  {text(pattern)}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="
          grid gap-3
          md:grid-cols-2
          xl:grid-cols-5
        ">
          {themes.map((theme) => (
            <a
              key={theme.name}
              href={`#${theme.name.toLowerCase().replaceAll(' ', '-')}`}
              className="
                rounded-lg border border-white/10 bg-white/4 p-4 transition
                hover:border-orange-200/30 hover:bg-white/[0.07]
              "
            >
              <theme.icon className="mb-3 size-5 text-orange-100" />
              <h2 className="text-sm font-semibold text-foreground">
                {language === 'en' ? theme.name : theme.nameEs}
              </h2>
              <p className="mt-3 text-sm/6 text-muted-foreground">
                {language === 'en' ? theme.focus : theme.focusEs}
              </p>
            </a>
          ))}
        </section>

        {themes.map((theme) => {
          const cards = studyCards.filter((card) => card.theme === theme.name)

          return (
            <section
              key={theme.name}
              id={theme.name.toLowerCase().replaceAll(' ', '-')}
              className="scroll-mt-8"
            >
              <div className="
                mb-4 flex flex-wrap items-end justify-between gap-3
              ">
                <div>
                  <p className="text-sm font-medium text-orange-100">
                    {language === 'en' ? theme.focus : theme.focusEs}
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {language === 'en' ? theme.name : theme.nameEs}
                  </h2>
                </div>
                <Badge variant="secondary">
                  {cards.length} {copy.cardsLabel}
                </Badge>
              </div>

              <div className="
                grid gap-4
                lg:grid-cols-2
              ">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className="
                      rounded-lg border border-white/10 bg-white/4 p-5 shadow-sm
                    "
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="
                          flex size-10 shrink-0 items-center justify-center
                          rounded-md bg-orange-300/10 text-orange-100
                        ">
                          <card.icon className="size-5" />
                        </div>
                        <div>
                          <p className="
                            text-xs font-semibold tracking-wide
                            text-orange-100/80 uppercase
                          ">
                            {copy.questionLabel}
                          </p>
                          <p className="
                            mt-2 text-lg/7 font-semibold text-foreground
                          ">
                            {text(card.question)}
                          </p>
                        </div>
                      </div>
                      <div className="
                        flex min-w-12 flex-col items-center rounded-md border
                        border-orange-200/20 bg-orange-300/10 px-3 py-2
                        text-orange-100
                      ">
                        <span className="text-[10px] tracking-wide uppercase">
                          {copy.answerLabel}
                        </span>
                        <span className="text-lg font-semibold">
                          {card.answer}
                        </span>
                      </div>
                    </div>

                    <div className="
                      mt-5 grid gap-3
                      sm:grid-cols-3
                    ">
                      <div>
                        <div className="
                          mb-2 flex items-center gap-2 text-xs font-semibold
                          tracking-wide text-orange-100/80 uppercase
                        ">
                          <CheckCircle2 className="size-3.5" />
                          {copy.whyLabel}
                        </div>
                        <p className="text-sm/6 text-foreground">
                          {text(card.why)}
                        </p>
                      </div>
                      <div>
                        <div className="
                          mb-2 flex items-center gap-2 text-xs font-semibold
                          tracking-wide text-orange-100/80 uppercase
                        ">
                          <Brain className="size-3.5" />
                          {copy.conceptLabel}
                        </div>
                        <p className="text-sm/6 text-foreground">
                          {text(card.concept)}
                        </p>
                      </div>
                      <div>
                        <div className="
                          mb-2 flex items-center gap-2 text-xs font-semibold
                          tracking-wide text-orange-100/80 uppercase
                        ">
                          <CircleHelp className="size-3.5" />
                          {copy.trapLabel}
                        </div>
                        <p className="text-sm/6 text-foreground">
                          {text(card.trap)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        <section className="rounded-lg border border-white/10 bg-white/4 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="
              flex size-10 items-center justify-center rounded-md
              bg-orange-300/10 text-orange-100
            ">
              <CircleHelp className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {copy.practiceTitle}
              </h2>
              <p className="text-sm text-muted-foreground">
                {copy.practiceIntro}
              </p>
            </div>
          </div>
          <div className="
            grid gap-3
            md:grid-cols-2
          ">
            {practice.map((item) => (
              <div
                key={item.q}
                className="
                  rounded-md border border-white/10 bg-background/40 p-4
                "
              >
                <p className="text-sm font-medium text-foreground">
                  {language === 'en' ? item.q : item.qEs}
                </p>
                <p className="mt-3 text-sm font-semibold text-orange-100">
                  {language === 'en' ? item.a.split(' / ')[0] : item.a.split(' / ')[1]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
