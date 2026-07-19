import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const perfilEnum = pgEnum("perfil", ["administrador", "monitoramento", "tatico"]);
export const prioridadeEnum = pgEnum("prioridade", ["baixa", "media", "alta", "emergencial"]);
export const statusChamadoEnum = pgEnum("status_chamado", [
  "novo",
  "recebido",
  "em_deslocamento",
  "em_atendimento",
  "resolvido",
  "aguardando_fechamento",
  "finalizado",
  "cancelado",
]);
export const categoriaEnum = pgEnum("categoria", [
  "furto",
  "tentativa_furto",
  "arrombamento",
  "invasao",
  "vandalismo",
  "briga",
  "ameaca",
  "alarme_disparado",
  "cerca_danificada",
  "portao_aberto",
  "janela_quebrada",
  "queda_energia",
  "camera_sem_imagem",
  "dvr_desligado",
  "internet_inoperante",
  "equipamento_danificado",
  "incendio",
  "emergencia_medica",
  "apoio_direcao",
  "outro",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  perfil: perfilEnum("perfil").notNull().default("monitoramento"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
  index("users_perfil_idx").on(table.perfil),
  index("users_ativo_idx").on(table.ativo),
]);

// Schools table
export const escolas = pgTable("escolas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull().unique(),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 50 }),
  coordenadaX: text("coordenada_x"),
  coordenadaY: text("coordenada_y"),
  ativa: boolean("ativa").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("escolas_ativa_idx").on(table.ativa),
]);

// Chamados (Tickets) table
export const chamados = pgTable("chamados", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull(),
  escolaId: integer("escola_id")
    .references(() => escolas.id)
    .notNull(),
  categoria: categoriaEnum("categoria").notNull(),
  prioridade: prioridadeEnum("prioridade").notNull().default("media"),
  descricao: text("descricao").notNull(),
  localOcorrencia: varchar("local_ocorrencia", { length: 255 }),
  status: statusChamadoEnum("status_chamado").notNull().default("novo"),
  monitoramentoId: integer("monitoramento_id")
    .references(() => users.id)
    .notNull(),
  taticoId: integer("tatico_id").references(() => users.id),
  dataAbertura: timestamp("data_abertura").defaultNow().notNull(),
  dataRecebimento: timestamp("data_recebimento"),
  dataDeslocamento: timestamp("data_deslocamento"),
  dataInicioAtendimento: timestamp("data_inicio_atendimento"),
  dataResolucao: timestamp("data_resolucao"),
  dataFechamento: timestamp("data_fechamento"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  criadoPor: integer("criado_por").references(() => users.id),
  atualizadoPor: integer("atualizado_por").references(() => users.id),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("chamados_status_idx").on(table.status),
  index("chamados_escola_id_idx").on(table.escolaId),
  index("chamados_categoria_idx").on(table.categoria),
  index("chamados_prioridade_idx").on(table.prioridade),
  index("chamados_monitoramento_id_idx").on(table.monitoramentoId),
  index("chamados_tatico_id_idx").on(table.taticoId),
  index("chamados_data_abertura_idx").on(table.dataAbertura),
  index("chamados_numero_idx").on(table.numero),
  index("chamados_created_at_idx").on(table.createdAt),
]);

// Atendimentos (Service Records) table
export const atendimentos = pgTable("atendimentos", {
  id: serial("id").primaryKey(),
  chamadoId: integer("chamado_id")
    .references(() => chamados.id)
    .notNull(),
  taticoId: integer("tatico_id")
    .references(() => users.id)
    .notNull(),
  dataChegada: timestamp("data_chegada").notNull(),
  horaChegada: varchar("hora_chegada", { length: 10 }),
  dataSaida: timestamp("data_saida"),
  horaSaida: varchar("hora_saida", { length: 10 }),
  solucaoAplicada: text("solucao_aplicada"),
  equipamentosUtilizados: text("equipamentos_utilizados"),
  descricaoAtendimento: text("descricao_atendimento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("atendimentos_chamado_id_idx").on(table.chamadoId),
  index("atendimentos_tatico_id_idx").on(table.taticoId),
]);

// Anexos (Attachments) table
export const anexos = pgTable("anexos", {
  id: serial("id").primaryKey(),
  chamadoId: integer("chamado_id")
    .references(() => chamados.id)
    .notNull(),
  arquivoNome: varchar("arquivo_nome", { length: 255 }).notNull(),
  arquivoUrl: varchar("arquivo_url", { length: 500 }).notNull(),
  tipo: varchar("tipo", { length: 50 }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("anexos_chamado_id_idx").on(table.chamadoId),
]);

// Logs table
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => users.id),
  usuarioNome: varchar("usuario_nome", { length: 255 }).notNull(),
  acao: text("acao").notNull(),
  descricao: text("descricao"),
  entidade: varchar("entidade", { length: 100 }),
  entidadeId: integer("entidade_id"),
  ip: varchar("ip", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("logs_usuario_id_idx").on(table.usuarioId),
  index("logs_acao_idx").on(table.acao),
  index("logs_entidade_idx").on(table.entidade),
  index("logs_created_at_idx").on(table.createdAt),
]);
