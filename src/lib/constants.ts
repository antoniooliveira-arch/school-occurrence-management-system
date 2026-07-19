// Categorias de ocorrências
export const CATEGORIAS = [
  { value: "furto", label: "Furto" },
  { value: "tentativa_furto", label: "Tentativa de Furto" },
  { value: "arrombamento", label: "Arrombamento" },
  { value: "invasao", label: "Invasão" },
  { value: "vandalismo", label: "Vandalismo" },
  { value: "briga", label: "Briga" },
  { value: "ameaca", label: "Ameaça" },
  { value: "alarme_disparado", label: "Alarme Disparado" },
  { value: "cerca_danificada", label: "Cerca Danificada" },
  { value: "portao_aberto", label: "Portão Aberto" },
  { value: "janela_quebrada", label: "Janela Quebrada" },
  { value: "queda_energia", label: "Queda de Energia" },
  { value: "camera_sem_imagem", label: "Câmera sem Imagem" },
  { value: "dvr_desligado", label: "DVR/NVR Desligado" },
  { value: "internet_inoperante", label: "Internet Inoperante" },
  { value: "equipamento_danificado", label: "Equipamento Danificado" },
  { value: "incendio", label: "Incêndio" },
  { value: "emergencia_medica", label: "Emergência Médica" },
  { value: "apoio_direcao", label: "Apoio à Direção" },
  { value: "outro", label: "Outro" },
] as const;

// Prioridades
export const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "bg-green-500" },
  { value: "media", label: "Média", color: "bg-yellow-500" },
  { value: "alta", label: "Alta", color: "bg-orange-500" },
  { value: "emergencial", label: "Emergencial", color: "bg-red-600" },
] as const;

// Status do chamado
export const STATUS_CHAMADO = [
  { value: "novo", label: "Novo", color: "bg-blue-100 text-blue-800" },
  { value: "recebido", label: "Recebido", color: "bg-cyan-100 text-cyan-800" },
  { value: "em_deslocamento", label: "Em Deslocamento", color: "bg-indigo-100 text-indigo-800" },
  { value: "em_atendimento", label: "Em Atendimento", color: "bg-yellow-100 text-yellow-800" },
  { value: "resolvido", label: "Resolvido", color: "bg-lime-100 text-lime-800" },
  { value: "aguardando_fechamento", label: "Aguardando Fechamento", color: "bg-purple-100 text-purple-800" },
  { value: "finalizado", label: "Finalizado", color: "bg-green-100 text-green-800" },
  { value: "cancelado", label: "Cancelado", color: "bg-gray-100 text-gray-800" },
] as const;

// Perfis
export const PERFIS = [
  { value: "administrador", label: "Administrador" },
  { value: "monitoramento", label: "Técnico Monitoramento" },
  { value: "tatico", label: "Técnico Tático" },
] as const;

// Get prioridade badge config
export function getPrioridadeConfig(value: string) {
  return PRIORIDADES.find(p => p.value === value) || PRIORIDADES[1];
}

// Get status badge config
export function getStatusConfig(value: string) {
  return STATUS_CHAMADO.find(s => s.value === value) || STATUS_CHAMADO[0];
}

// Get categoria label
export function getCategoriaLabel(value: string) {
  return CATEGORIAS.find(c => c.value === value)?.label || value;
}

// Get perfil label
export function getPerfilLabel(value: string) {
  return PERFIS.find(p => p.value === value)?.label || value;
}
