CREATE TYPE "public"."categoria" AS ENUM('furto', 'tentativa_furto', 'arrombamento', 'invasao', 'vandalismo', 'briga', 'ameaca', 'alarme_disparado', 'cerca_danificada', 'portao_aberto', 'janela_quebrada', 'queda_energia', 'camera_sem_imagem', 'dvr_desligado', 'internet_inoperante', 'equipamento_danificado', 'incendio', 'emergencia_medica', 'apoio_direcao', 'outro');--> statement-breakpoint
CREATE TYPE "public"."perfil" AS ENUM('administrador', 'monitoramento', 'tatico');--> statement-breakpoint
CREATE TYPE "public"."prioridade" AS ENUM('baixa', 'media', 'alta', 'emergencial');--> statement-breakpoint
CREATE TYPE "public"."status_chamado" AS ENUM('novo', 'recebido', 'em_deslocamento', 'em_atendimento', 'resolvido', 'aguardando_fechamento', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TABLE "anexos" (
	"id" serial PRIMARY KEY NOT NULL,
	"chamado_id" integer NOT NULL,
	"arquivo_nome" varchar(255) NOT NULL,
	"arquivo_url" varchar(500) NOT NULL,
	"tipo" varchar(50),
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"chamado_id" integer NOT NULL,
	"tatico_id" integer NOT NULL,
	"data_chegada" timestamp NOT NULL,
	"hora_chegada" varchar(10),
	"data_saida" timestamp,
	"hora_saida" varchar(10),
	"solucao_aplicada" text,
	"equipamentos_utilizados" text,
	"descricao_atendimento" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chamados" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" integer NOT NULL,
	"escola_id" integer NOT NULL,
	"categoria" "categoria" NOT NULL,
	"prioridade" "prioridade" DEFAULT 'media' NOT NULL,
	"descricao" text NOT NULL,
	"local_ocorrencia" varchar(255),
	"status_chamado" "status_chamado" DEFAULT 'novo' NOT NULL,
	"monitoramento_id" integer NOT NULL,
	"tatico_id" integer,
	"data_abertura" timestamp DEFAULT now() NOT NULL,
	"data_recebimento" timestamp,
	"data_deslocamento" timestamp,
	"data_inicio_atendimento" timestamp,
	"data_resolucao" timestamp,
	"data_fechamento" timestamp,
	"latitude" varchar(50),
	"longitude" varchar(50),
	"criado_por" integer,
	"atualizado_por" integer,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escolas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"endereco" text,
	"telefone" varchar(50),
	"coordenada_x" text,
	"coordenada_y" text,
	"ativa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "escolas_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer,
	"usuario_nome" varchar(255) NOT NULL,
	"acao" text NOT NULL,
	"descricao" text,
	"entidade" varchar(100),
	"entidade_id" integer,
	"ip" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha" varchar(255) NOT NULL,
	"perfil" "perfil" DEFAULT 'monitoramento' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_chamado_id_chamados_id_fk" FOREIGN KEY ("chamado_id") REFERENCES "public"."chamados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_chamado_id_chamados_id_fk" FOREIGN KEY ("chamado_id") REFERENCES "public"."chamados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_tatico_id_users_id_fk" FOREIGN KEY ("tatico_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_monitoramento_id_users_id_fk" FOREIGN KEY ("monitoramento_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_tatico_id_users_id_fk" FOREIGN KEY ("tatico_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_atualizado_por_users_id_fk" FOREIGN KEY ("atualizado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anexos_chamado_id_idx" ON "anexos" USING btree ("chamado_id");--> statement-breakpoint
CREATE INDEX "atendimentos_chamado_id_idx" ON "atendimentos" USING btree ("chamado_id");--> statement-breakpoint
CREATE INDEX "atendimentos_tatico_id_idx" ON "atendimentos" USING btree ("tatico_id");--> statement-breakpoint
CREATE INDEX "chamados_status_idx" ON "chamados" USING btree ("status_chamado");--> statement-breakpoint
CREATE INDEX "chamados_escola_id_idx" ON "chamados" USING btree ("escola_id");--> statement-breakpoint
CREATE INDEX "chamados_categoria_idx" ON "chamados" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "chamados_prioridade_idx" ON "chamados" USING btree ("prioridade");--> statement-breakpoint
CREATE INDEX "chamados_monitoramento_id_idx" ON "chamados" USING btree ("monitoramento_id");--> statement-breakpoint
CREATE INDEX "chamados_tatico_id_idx" ON "chamados" USING btree ("tatico_id");--> statement-breakpoint
CREATE INDEX "chamados_data_abertura_idx" ON "chamados" USING btree ("data_abertura");--> statement-breakpoint
CREATE INDEX "chamados_numero_idx" ON "chamados" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "chamados_created_at_idx" ON "chamados" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "escolas_ativa_idx" ON "escolas" USING btree ("ativa");--> statement-breakpoint
CREATE INDEX "logs_usuario_id_idx" ON "logs" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "logs_acao_idx" ON "logs" USING btree ("acao");--> statement-breakpoint
CREATE INDEX "logs_entidade_idx" ON "logs" USING btree ("entidade");--> statement-breakpoint
CREATE INDEX "logs_created_at_idx" ON "logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_perfil_idx" ON "users" USING btree ("perfil");--> statement-breakpoint
CREATE INDEX "users_ativo_idx" ON "users" USING btree ("ativo");