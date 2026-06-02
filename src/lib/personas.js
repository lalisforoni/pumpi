export const PERSONAS = [
  { keys: ["coice"],                       name: "Coice da Égua",       emoji: "🐴", color: "#ff7eb3" },
  { keys: ["abdutora"],                    name: "Abre & Abre",         emoji: "🦋", color: "#a78bfa" },
  { keys: ["adutora"],                     name: "Fecha & Fecha",       emoji: "🦋", color: "#a78bfa" },
  { keys: ["mesa flexora"],                name: "Deitada & Humilhada", emoji: "🌀", color: "#60d0ff" },
  { keys: ["cadeira flexora"],             name: "A Puxadinha",         emoji: "🪝", color: "#86efac" },
  { keys: ["cadeira extensora"],           name: "Pontapé da Fama",     emoji: "🦵", color: "#fbbf24" },
  { keys: ["leg press"],                   name: "Empurrão Rainha",     emoji: "👑", color: "#f472b6" },
  { keys: ["agachamento"],                 name: "Vai Fundo",           emoji: "🍑", color: "#fb923c" },
  { keys: ["panturrilha"],                 name: "Na Ponta do Pé",      emoji: "💃", color: "#34d399" },
  { keys: ["hip thrust"],                  name: "Empurra Bunda",       emoji: "🚀", color: "#c084fc" },
  { keys: ["stiff"],                       name: "Curvada Elegante",    emoji: "🎩", color: "#94a3b8" },
  { keys: ["afundo", "passada"],           name: "Passadinha Dramática",emoji: "🎭", color: "#f59e0b" },
  { keys: ["supino"],                      name: "Peito Aberto",        emoji: "🦅", color: "#38bdf8" },
  { keys: ["puxada"],                      name: "Macacona",            emoji: "🦍", color: "#a3e635" },
  { keys: ["remada"],                      name: "A Barqueira",         emoji: "🚣", color: "#22d3ee" },
  { keys: ["bíceps", "bicep", "rosca"],    name: "Mostra o Músculo",    emoji: "💪", color: "#fb7185" },
  { keys: ["tríceps", "tricep"],           name: "O Que Balança Atrás", emoji: "🔔", color: "#a78bfa" },
  { keys: ["ombro", "desenvolv"],          name: "Largura de Porta",    emoji: "🚪", color: "#60a5fa" },
  { keys: ["crucifixo", "voador"],         name: "Cristo Redentor",     emoji: "🗿", color: "#4ade80" },
  { keys: ["glut", "gluteo"],              name: "Bunda Power",         emoji: "🍑", color: "#e879f9" },
];

export function getPersona(name) {
  const n = name.toLowerCase();
  return PERSONAS.find(p => p.keys.some(k => n.includes(k))) || { name, emoji: "🏋️", color: "#94a3b8" };
}

export const defaultMachines = {
  lower: ["Mesa Flexora","Adutora","Abdutora","Cadeira Flexora","Cadeira Extensora","Leg Press","Panturrilha","Agachamento"],
  upper: ["Supino","Puxada Frontal","Remada","Desenvolvimento","Crucifixo","Bíceps","Tríceps","Ombro","Rosca Direta","Voador"],
};

export const repOptions = ["6-8","8-10","10-12","12-15","6","8","10","12","15"];
